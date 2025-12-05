<?php

namespace App\Http\Controllers;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use Illuminate\Support\Facades\DB;

class QuizAttemptController extends Controller
{
    public function start(Request $request, Quiz $quiz)
    {
        $data = $request->validate([
            'id_owner' => 'required|string',
            'lang'     => 'required|string',
        ]);

        $user = User::where('id_azure', $data['id_owner'])->first();

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $attempt = QuizAttempt::create([
            'id_quiz'    => $quiz->id_quiz,
            'id_user'    => $user->id_user,
            'started_at' => now(),
            'lang'       => $data['lang'],
            'status'     => 'in_progress',
        ]);

        return response()->json([
            'message' => 'Attempt started',
            'attempt_id' => $attempt->id_attempt,
            'started_at' => $attempt->started_at,
        ], 201);
    }

    public function finish(Request $request, Quiz $quiz, QuizAttempt $attempt)
    {
        $data = $request->validate([
            'ended_at'   => 'required|date',
            'time_taken' => 'required|integer',
            'answers'    => 'required|array',
            'lang'       => 'required|string',
        ]);

        if ($attempt->id_quiz !== $quiz->id_quiz) {
            return response()->json(['message' => 'Attempt does not belong to quiz'], 400);
        }

        DB::beginTransaction();

        try {
            $totalScore = 0;
            $bestPossibleScore = 0;
            $results = [];
            $lang = $data['lang'];

            foreach ($data['answers'] as $answer) {
                $question = $quiz->questions()->with('answers')->find($answer['id_question']);
                if (!$question) continue;

                $correctAnswerIds = $question->answers->filter(fn($a) => $a->is_correct)->pluck('id_answer')->toArray();
                $userAnswerIds = $answer['answer_ids'] ?? [];

                $numCorrectSelected = count(array_intersect($userAnswerIds, $correctAnswerIds));
                $numWrongSelected   = count(array_diff($userAnswerIds, $correctAnswerIds));
                $numCorrectTotal    = count($correctAnswerIds);

                $questionScore = max(($numCorrectSelected - $numWrongSelected) / max($numCorrectTotal, 1), 0);
                $totalScore += $questionScore;
                $bestPossibleScore += 1;

                // Save attempt answers
                $attempt->answers()->create([
                    'id_question' => $answer['id_question'],
                    'answer_ids'  => $userAnswerIds,
                    'answer_text' => $answer['answer_text'] ?? null,
                ]);

                // Fetch translations for answers from DB
                $answerTranslations = DB::table('translations')
                    ->where('element_type', 'answer')
                    ->where('lang', $lang)
                    ->whereIn('element_id', $question->answers->pluck('id_answer'))
                    ->where('field_name', 'answer_text')
                    ->pluck('element_text', 'element_id')
                    ->toArray();

                $answersResult = $question->answers->map(function ($a) use ($userAnswerIds, $correctAnswerIds, $answerTranslations) {
                    return array_merge([
                        'id' => $a->id_answer,
                        'text' => $a->text,
                        'translation' => $answerTranslations[$a->id_answer] ?? null,
                    ], in_array($a->id_answer, $userAnswerIds) ? [
                        'is_correct' => in_array($a->id_answer, $correctAnswerIds),
                    ] : []);
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

            $finalScore = $totalScore;

            $attempt->update([
                'ended_at' => Carbon::parse($data['ended_at']),
                'time_taken' => $data['time_taken'],
                'score' => round($finalScore, 2),
                'status' => 'completed',
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Quiz attempt completed',
                'score' => round($finalScore, 2),
                'best_possible_score' => $bestPossibleScore,
                'time_taken' => $attempt->time_taken,
                'answers' => $results,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to complete attempt',
                'error' => $e->getMessage(),
            ], 500);
        }
    }




}
