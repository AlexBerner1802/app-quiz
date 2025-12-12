<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ProfileController extends Controller
{
    public function show(string $id_user): JsonResponse
    {
        $u = DB::table('users as u')
            ->leftJoin('roles as r', 'r.id_role', '=', 'u.id_role')
            ->where('u.id_user', $id_user)
            ->select([
                'u.id_user',
                'u.id_azure',
                'u.id_role',
                'u.avatar',
                'u.username',
                'u.name',
                'u.is_dark_mode',
                DB::raw('COALESCE(r.name, "") as role_name'),
            ])
            ->first();

        if (!$u) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $attemptsBase = DB::table('quiz_attempts')->where('id_user', $id_user);

        $totalAttempts = (int) $attemptsBase->count();
        $totalPoints   = (int) $attemptsBase->sum('score');
        $totalTimeSec  = (int) $attemptsBase->sum('time_taken');

        [$trueCount, $falseCount] = $this->computeTrueFalsePhp($id_user);

        $quizAgg = DB::table('quiz_attempts')
            ->where('id_user', $id_user)
            ->groupBy('id_quiz')
            ->select([
                'id_quiz',
                DB::raw('COUNT(id_attempt) as attempts'),
                DB::raw('MAX(score) as bestScore'),
            ])
            ->orderByDesc('bestScore')
            ->get();

        $quizIds = $quizAgg->pluck('id_quiz')->all();
        $titlesById = $this->tryFetchQuizTitles($quizIds);

        $quizzes = $quizAgg->map(function ($row) use ($titlesById) {
            $qid = (string) $row->id_quiz;

            return [
                'id'        => $row->id_quiz,
                'title'     => $titlesById[$qid] ?? ("Quiz #" . $qid),
                'attempts'  => (int) $row->attempts,
                'bestScore' => (int) $row->bestScore,
            ];
        });

        return response()->json([
            'user' => [
                'id_user'      => $u->id_user,
                'id_azure'     => $u->id_azure,
                'id_role'      => $u->id_role,
                'roleName'     => $u->role_name,
                'avatar'       => $u->avatar,
                'name'         => $u->name,
                'username'     => $u->username,
                'is_dark_mode' => (bool) $u->is_dark_mode,
            ],
            'stats' => [
                'totalAttempts' => $totalAttempts,
                'true'          => $trueCount,
                'false'         => $falseCount,
                'totalPoints'   => $totalPoints,
                'totalTimeSec'  => $totalTimeSec,
            ],
            'quizzes' => $quizzes,
        ]);
    }

    public function quizResults(string $id_user, string $id_quiz): JsonResponse
    {
        $userExists = DB::table('users')->where('id_user', $id_user)->exists();
        if (!$userExists) return response()->json(['message' => 'User not found'], 404);

        $attempts = DB::table('quiz_attempts')
            ->where('id_user', $id_user)
            ->where('id_quiz', $id_quiz)
            ->orderByDesc('id_attempt')
            ->get([
                'id_attempt',
                'id_quiz',
                'lang',
                'time_taken',
                'score',
                'started_at',
                'ended_at',
                'created_at',
            ]);

        return response()->json([
            'quiz' => [
                'id' => (int)$id_quiz,
                'title' => "Quiz #".$id_quiz,
            ],
            'attempts' => $attempts,
        ]);
    }


    private function computeTrueFalsePhp(string $id_user): array
    {
        $attemptAnswersTable = $this->resolveAttemptAnswersTableName();
        if ($attemptAnswersTable === null) {
            return [0, 0];
        }

        $rows = DB::table($attemptAnswersTable . ' as qaa')
            ->join('quiz_attempts as qa', 'qa.id_attempt', '=', 'qaa.id_attempt')
            ->where('qa.id_user', $id_user)
            ->pluck('qaa.answer_ids')
            ->all();

        if (!$rows) return [0, 0];

        $pickedIds = [];
        foreach ($rows as $raw) {
            if ($raw === null) continue;

            $rawStr = trim((string) $raw);
            if ($rawStr === '') continue;

            $decoded = json_decode($rawStr, true);
            if (is_array($decoded)) {
                foreach ($decoded as $v) {
                    if (is_numeric($v)) $pickedIds[] = (int) $v;
                }
                continue;
            }

            if (preg_match_all('/\d+/', $rawStr, $m)) {
                foreach ($m[0] as $num) $pickedIds[] = (int) $num;
            }
        }

        if (!$pickedIds) return [0, 0];

        $uniqueIds = array_values(array_unique($pickedIds));

        $map = DB::table('answers')
            ->whereIn('id_answer', $uniqueIds)
            ->pluck('is_correct', 'id_answer')
            ->all();

        $true = 0;
        $false = 0;

        foreach ($pickedIds as $id) {
            if (!array_key_exists($id, $map)) continue;
            ((int) $map[$id] === 1) ? $true++ : $false++;
        }

        return [$true, $false];
    }

    private function resolveAttemptAnswersTableName(): ?string
    {
        foreach (['quiz_attempt_answer', 'quiz_attempt_answers'] as $name) {
            if (DB::getSchemaBuilder()->hasTable($name)) {
                if (DB::getSchemaBuilder()->hasColumn($name, 'id_attempt') &&
                    DB::getSchemaBuilder()->hasColumn($name, 'answer_ids')) {
                    return $name;
                }
            }
        }
        return null;
    }

    private function tryFetchQuizTitles(array $quizIds): array
    {
        if (count($quizIds) === 0) return [];

        try {
            if (DB::getSchemaBuilder()->hasColumn('quizzes', 'id_quiz') &&
                DB::getSchemaBuilder()->hasColumn('quizzes', 'title')) {

                return DB::table('quizzes')
                    ->whereIn('id_quiz', $quizIds)
                    ->pluck('title', 'id_quiz')
                    ->mapWithKeys(fn ($v, $k) => [(string) $k => $v])
                    ->all();
            }

            if (DB::getSchemaBuilder()->hasColumn('quizzes', 'id') &&
                DB::getSchemaBuilder()->hasColumn('quizzes', 'title')) {

                return DB::table('quizzes')
                    ->whereIn('id', $quizIds)
                    ->pluck('title', 'id')
                    ->mapWithKeys(fn ($v, $k) => [(string) $k => $v])
                    ->all();
            }
        } catch (\Throwable $e) {

        }

        return [];
    }

}
