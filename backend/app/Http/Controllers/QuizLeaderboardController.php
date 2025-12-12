<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class QuizLeaderboardController extends Controller
{
    public function show(string $id_quiz): JsonResponse
    {
        $best = DB::table('quiz_attempts')
            ->where('id_quiz', $id_quiz)
            ->groupBy('id_user')
            ->selectRaw('id_user')
            ->selectRaw('MAX(score) as best_score')
            ->selectRaw('COUNT(id_attempt) as attempts');

        $rows = DB::query()
            ->fromSub($best, 'b')
            ->join('quiz_attempts as qa', function ($join) use ($id_quiz) {
                $join->on('qa.id_user', '=', 'b.id_user')
                     ->on('qa.score', '=', 'b.best_score')
                     ->where('qa.id_quiz', '=', $id_quiz);
            })
            ->join('users as u', 'u.id_user', '=', 'b.id_user')
            ->groupBy('b.id_user', 'b.best_score', 'b.attempts', 'u.name', 'u.username')
            ->selectRaw('b.id_user')
            ->selectRaw('COALESCE(NULLIF(u.name, ""), u.username) as user_name')
            ->selectRaw('b.best_score as score')
            ->selectRaw('MIN(qa.time_taken) as time_seconds')
            ->selectRaw('b.attempts as attempts')
            ->orderByDesc('score')
            ->orderBy('time_seconds')
            ->limit(200)
            ->get();

        $results = $rows->values()->map(function ($r, $i) {
            return [
                'rank' => $i + 1,
                'user_name' => (string)($r->user_name ?? ''),
                'score' => (int)($r->score ?? 0),
                'time_seconds' => (int)($r->time_seconds ?? 0),
                'attempts' => (int)($r->attempts ?? 0),
            ];
        });

        return response()->json([
            'quiz' => [
                'id' => (int)$id_quiz,
            ],
            'results' => $results,
        ]);
    }
}
