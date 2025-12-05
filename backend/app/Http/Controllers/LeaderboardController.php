<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LeaderboardController extends Controller
{
    public function index(Request $request)
    {
        $lang    = $request->input('lang', 'fr');
        $quizId  = $request->integer('quiz_id');
        $ownerId = $request->input('id_owner');

        $query = DB::table('quiz_attempts as qa')
            ->join('users as u', 'u.id_user', '=', 'qa.id_user')
            ->join('quiz as q', 'q.id_quiz', '=', 'qa.id_quiz')
            ->leftJoin('translations as t', function ($join) use ($lang) {
                $join->on('t.element_id', '=', 'q.id_quiz')
                    ->where('t.element_type', '=', 'quiz')
                    ->where('t.field_name', '=', 'title')
                    ->where('t.lang', '=', $lang);
            })
            ->selectRaw('
                u.id_user,
                COALESCE(u.username, u.name, CONCAT("Random numéro ", u.id_user)) as user_name,
                qa.id_quiz,
                COALESCE(t.element_text, CONCAT("Quiz #", qa.id_quiz)) as quiz_title,
                COUNT(*) as attempts,
                MAX(qa.score) as best_score,
                MIN(qa.time_taken) as best_time
            ')
            ->whereNotNull('qa.score');

        if ($quizId) {
            $query->where('qa.id_quiz', $quizId);
        }

        if ($ownerId) {
            $query->where('q.id_owner', $ownerId);
        }

        $rows = $query
            ->groupBy('u.id_user', 'qa.id_quiz', 'user_name', 'quiz_title')
            ->orderByDesc('best_score')
            ->orderBy('best_time')
            ->get();

        $rank  = 1;
        $data  = $rows->map(function ($row) use (&$rank) {
            return [
                'id'          => $row->id_user,
                'rank'        => $rank++,
                'userName'    => $row->user_name,
                'score'       => (float) $row->best_score,
                'timeSeconds' => (int) $row->best_time,
                'attempts'    => (int) $row->attempts,
                'quizName'    => $row->quiz_title,
            ];
        });

        return response()->json($data);
    }
}
