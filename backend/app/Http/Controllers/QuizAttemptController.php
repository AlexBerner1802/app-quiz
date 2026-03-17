<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use App\Models\Quiz;
use App\Models\QuizAttempt;

class QuizAttemptController extends Controller
{
    public function start(Request $request, Quiz $quiz): JsonResponse
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthenticated'], 401);

        $data = $request->validate([
            'lang' => ['required', 'string', 'max:10'],
        ]);

        $quizId = $quiz->id_quiz ?? $quiz->id;
        $userId = $user->id_user ?? $user->id;

        $existing = QuizAttempt::query()
            ->where('id_quiz', $quizId)
            ->where('id_user', $userId)
            ->whereNull('ended_at')
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Attempt already in progress',
                'attempt' => $existing,
            ], 200);
        }

        $attempt = QuizAttempt::create([
            'id_quiz'    => $quizId,
            'id_user'    => $userId,
            'lang'       => $data['lang'],
            'started_at' => now(),
        ]);

        return response()->json([
            'message' => 'Attempt started',
            'attempt' => $attempt,
        ], 201);
    }

    public function finish(Request $request, Quiz $quiz, QuizAttempt $attempt): JsonResponse
    {
        $authUser = $request->user();
        if (!$authUser) return response()->json(['message' => 'Unauthenticated'], 401);

        $quizId = $quiz->id_quiz ?? $quiz->id;
        $userId = $authUser->id_user ?? $authUser->id;

        // attempt must match quiz
        if ((int)$attempt->id_quiz !== (int)$quizId) {
            return response()->json(['message' => 'Attempt does not belong to this quiz'], 404);
        }

        // attempt must belong to current user
        if ((int)$attempt->id_user !== (int)$userId) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // prevent double finish
        if (!is_null($attempt->ended_at)) {
            return response()->json([
                'message' => 'Attempt already finished',
                'attempt' => $attempt,
            ], 200);
        }

        $data = $request->validate([
            'ended_at'   => ['required', 'date'],
            'time_taken' => ['required', 'integer', 'min:0'],
            'answers'    => ['required', 'array', 'min:1'],
            'lang'       => ['required', 'string', 'max:10'],

            'answers.*.id_question' => ['required', 'integer', 'min:1'],
            'answers.*.answer_ids'  => ['nullable', 'array'],
            'answers.*.answer_ids.*'=> ['integer', 'min:1'],
            'answers.*.answer_text' => ['nullable', 'string'],
        ]);

        $qids = array_map(fn($a) => (int)$a['id_question'], $data['answers']);
        if (count($qids) !== count(array_unique($qids))) {
            throw ValidationException::withMessages([
                'answers' => ['Duplicate id_question detected in answers payload.'],
            ]);
        }

        DB::beginTransaction();

        try {
            $totalScore = 0;
            $bestPossibleScore = 0;
            $results = [];
            $lang = $data['lang'];

            $attempt->answers()->delete();

            foreach ($data['answers'] as $answer) {
                $question = $quiz->questions()->with('answers')->find($answer['id_question']);
                if (!$question) continue;

                $correctAnswerIds = $question->answers
                    ->filter(fn($a) => (bool)$a->is_correct)
                    ->pluck('id_answer')
                    ->toArray();

                $userAnswerIds = $answer['answer_ids'] ?? [];

                $numCorrectSelected = count(array_intersect($userAnswerIds, $correctAnswerIds));
                $numWrongSelected   = count(array_diff($userAnswerIds, $correctAnswerIds));
                $numCorrectTotal    = count($correctAnswerIds);

                $questionScore = max(($numCorrectSelected - $numWrongSelected) / max($numCorrectTotal, 1), 0);
                $totalScore += $questionScore;
                $bestPossibleScore += 1;

                $attempt->answers()->create([
                    'id_question' => (int)$answer['id_question'],
                    'answer_ids'  => $userAnswerIds,
                    'answer_text' => $answer['answer_text'] ?? null,
                ]);

                $answerTranslations = DB::table('translations')
                    ->where('element_type', 'answer')
                    ->where('lang', $lang)
                    ->whereIn('element_id', $question->answers->pluck('id_answer'))
                    ->where('field_name', 'answer_text')
                    ->pluck('element_text', 'element_id')
                    ->toArray();

                $answersResult = $question->answers->map(function ($a) use ($userAnswerIds, $correctAnswerIds, $answerTranslations) {
                    $base = [
                        'id' => $a->id_answer,
                        'text' => $a->text,
                        'translation' => $answerTranslations[$a->id_answer] ?? null,
                    ];

                    if (in_array($a->id_answer, $userAnswerIds)) {
                        $base['is_correct'] = in_array($a->id_answer, $correctAnswerIds);
                    }

                    return $base;
                });

                $tQuestion = DB::table('translations')
                    ->where('element_type', 'question')
                    ->where('element_id', $question->id_question)
                    ->where('lang', $lang)
                    ->where('field_name', 'question_title')
                    ->value('element_text');

                $results[] = [
                    'question' => $tQuestion ?? '[Missing translation]',
                    'user_answer_ids' => $userAnswerIds,
                    'answers' => $answersResult,
                    'score' => $questionScore,
                ];
            }

            $attempt->update([
                'ended_at'   => Carbon::parse($data['ended_at']),
                'time_taken' => $data['time_taken'],
                'score'      => round($totalScore, 2),
                'lang'       => $data['lang'],
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Quiz attempt completed',
                'score' => round($totalScore, 2),
                'best_possible_score' => $bestPossibleScore,
                'time_taken' => $attempt->time_taken,
                'answers' => $results,
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to complete attempt',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}