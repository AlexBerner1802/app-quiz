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
    public function store(Request $request, Quiz $quiz)
    {
        $data = $request->validate([
            'started_at' => 'required|date',
            'ended_at'   => 'required|date',
            'time_taken' => 'required|integer',
            'lang'       => 'required|string',
            'azure_id'   => 'required|string',
            'answers'    => 'required|array',
            'answers.*.id_question' => 'required|integer|exists:questions,id_question',
            'answers.*.answer_ids' => 'nullable|array',
            'answers.*.answer_text' => 'nullable',
        ]);

        // Find the Laravel user using Azure ID
        $user = User::where('azure_id', $data['azure_id'])->first();

        if (!$user) {
            return response()->json([
                'message' => 'User not found for provided Azure ID'
            ], 404);
        }

        DB::beginTransaction();

        try {
            // Create the main quiz attempt
            $attempt = QuizAttempt::create([
                'id_quiz'    => $quiz->id_quiz,
                'id_user'    => $user->id_user,
                'started_at' => Carbon::parse($data['started_at']),
                'ended_at'   => Carbon::parse($data['ended_at']),
                'time_taken' => $data['time_taken'],
                'lang'       => $data['lang'],
            ]);

            $totalScore = 0;
            $results = [];

            foreach ($data['answers'] as $answer) {
                $question = $quiz->questions()->with('answers')->find($answer['id_question']);

                // IDs of correct answers for this question
                $correctAnswerIds = $question->answers->filter(fn($a) => $a->is_correct)->pluck('id_answer')->toArray();
                $userAnswerIds = $answer['answer_ids'] ?? [];

                // Calculate partial score
                $numCorrectSelected = count(array_intersect($userAnswerIds, $correctAnswerIds));
                $numWrongSelected   = count(array_diff($userAnswerIds, $correctAnswerIds));
                $numCorrectTotal    = count($correctAnswerIds);

                // Formula: (# correct selected - # wrong selected) / total correct
                // Minimum score is 0
                $questionScore = max(($numCorrectSelected - $numWrongSelected) / max($numCorrectTotal, 1), 0);
                $totalScore += $questionScore;

                // Save user's answers
                $attempt->answers()->create([
                    'id_question' => $answer['id_question'],
                    'answer_ids'  => $userAnswerIds,
                    'answer_text' => $answer['answer_text'] ?? null,
                ]);

                $results[] = [
                    'question' => $question->title,
                    'user_answer_ids' => $userAnswerIds,
                    'correct_answer_ids' => $correctAnswerIds,
                    'score' => $questionScore,
                ];
            }

            // Adjust score by time_taken if desired
            // $finalScore = $totalScore / max($attempt->time_taken, 1);
            $finalScore = $totalScore;

            // Save total score in quiz_attempts table
            $attempt->score = round($finalScore, 2);
            $attempt->save();

            DB::commit();

            $totalQuestions = count($data['answers']);

            return response()->json([
                'message' => 'Quiz attempt saved successfully',
                'score' => round($finalScore, 2),
                'total_questions' => $totalQuestions,
                'time_taken' => $attempt->time_taken,
                'answers' => $results,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to save quiz attempt',
                'error' => $e->getMessage()
            ], 500);
        }
    }


}
