<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\UserQuizAnswer;
use App\Models\Quiz;
use Illuminate\Http\Request;

class AnswerController extends Controller
{
    // POST /api/answers
    // body: { id_user, id_quiz, id_question, id_answers }
    public function store(Request $req)
    {
        $data = $req->validate([
            'id_user'     => 'required|integer',
            'id_quiz'     => 'required|integer|exists:quiz,id',
            'id_question'=> 'required|integer|exists:questions,id',
            'id_answers'  => 'required|integer|exists:answers,id',
        ]);

        $uqa = UserQuizAnswer::create($data);
        return response()->json($uqa, 201);
    }

    // GET /api/results/{quizId}?user_id=123
    public function userResults($quizId, Request $req)
    {
        $userId = (int) $req->query('user_id');
        if (!$userId) {
            return response()->json(['message' => 'user_id requis'], 422);
        }

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
