<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\UserQuizAnswer;
use App\Models\Quiz;
use Illuminate\Http\Request;

class AnswerController extends Controller
{
    public function store(Request $req)
    {
        $user = $req->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $data = $req->validate([
            'id_quiz' => 'required|integer|exists:quiz,id',
            'id_question' => 'required|integer|exists:questions,id',
            'id_answers' => 'required|integer|exists:answers,id',
        ]);

        $uqa = UserQuizAnswer::create([
            'id_user' => $user->id_user,
            'id_quiz' => $data['id_quiz'],
            'id_question' => $data['id_question'],
            'id_answers' => $data['id_answers'],
        ]);

        return response()->json($uqa, 201);
    }

    public function myResults($quizId, Request $req)
    {
        $user = $req->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $userId = (int) $user->id_user;
        $quiz = Quiz::with(['questions.answers'])->findOrFail($quizId);

        $rows = UserQuizAnswer::where('id_user', $userId)
            ->where('id_quiz', $quizId)
            ->get();

        $correct = 0;
        foreach ($rows as $row) {
            $correct += (int) ($row->answer->is_correct ?? 0);
        }

        return response()->json([
            'quiz_id' => $quizId,
            'user_id' => $userId,
            'answers_submitted' => $rows->count(),
            'score' => $correct,
            'total_questions' => $quiz->questions->count(),
        ]);
    }
}