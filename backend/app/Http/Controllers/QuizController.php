<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Models\Quiz;
use App\Models\Tag;

class QuizController extends Controller
{
    /* --- Helpers (langs / translations) --- */

    // Resolve lang code -> id (422 if unknown)
    private function langId(string $langCode): int
    {
        $id = DB::table('lang')->where('lang', $langCode)->value('id');
        if (!$id) abort(422, "Lang code inconnu: {$langCode}");
        return (int)$id;
    }

    // Upsert quiz translation field
    private function upsertQuizTr(int $langId, int $quizId, string $field, string $text): void
    {
        DB::table('translations')->upsert([[
            'lang'      => $langId,
            'element_type' => 'quiz',
            'field_name'   => $field,
            'quiz_id'      => $quizId,
            'element_text' => $text,
            'created_at'   => now(),
            'updated_at'   => now(),
        ]], ['lang','field_name','quiz_id'], ['element_text','updated_at']);
    }

    // Upsert question translation field
    private function upsertQuestionTr(int $langId, int $questionId, string $field, ?string $text): void
    {
        DB::table('translations')->upsert([[
            'lang'      => $langId,
            'element_type' => 'question',
            'field_name'   => $field,
            'question_id'  => $questionId,
            'element_text' => $text ?? '',
            'created_at'   => now(),
            'updated_at'   => now(),
        ]], ['lang','field_name','question_id'], ['element_text','updated_at']);
    }

    // Upsert answer translation (answer_text)
    private function upsertAnswerTr(int $langId, int $answerId, string $text): void
    {
        DB::table('translations')->upsert([[
            'lang'      => $langId,
            'element_type' => 'answer',
            'field_name'   => 'answer_text',
            'answer_id'    => $answerId,
            'element_text' => $text,
            'created_at'   => now(),
            'updated_at'   => now(),
        ]], ['lang','field_name','answer_id'], ['element_text','updated_at']);
    }

    // Upsert activation per language
    private function upsertActiveQuiz(int $quizId, int $langId, bool $isActive): void
    {
        DB::table('active_quiz')->upsert([[
            'id_quiz'    => $quizId,
            'lang'       => $langId,
            'is_active'  => $isActive ? 1 : 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]], ['id_quiz','lang'], ['is_active','updated_at']);
    }

    /* --- Aggregators & Syncers (modules / tags) --- */

    // Aggregate module ids across all languages (null = do nothing)
    private function collectModuleIdsFromLanguages(array $languages): ?array
    {
        $all = [];
        $seen = false;
        foreach ($languages as $L) {
            if (array_key_exists('module_ids', $L)) {
                $seen = true;
                foreach ((array)($L['module_ids'] ?? []) as $v) $all[] = (int)$v;
            }
        }
        if (!$seen) return null;
        $all = array_values(array_unique(array_filter($all, fn($v)=>$v>0)));
        return $all;
    }

    // Aggregate tag ids and new_tags across all languages (null = do nothing)
    private function collectTagsFromLanguages(array $languages): array
    {
        $tagIds = [];
        $newTags = [];
        $seenAny = false;

        foreach ($languages as $L) {
            if (array_key_exists('tag_ids', $L)) {
                $seenAny = true;
                foreach ((array)($L['tag_ids'] ?? []) as $v) $tagIds[] = (int)$v;
            }
            if (array_key_exists('new_tags', $L)) {
                $seenAny = true;
                foreach ((array)($L['new_tags'] ?? []) as $name) {
                    $name = trim((string)$name);
                    if ($name !== '') $newTags[] = $name;
                }
            }
        }
        $tagIds = array_values(array_unique(array_filter($tagIds, fn($v)=>$v>0)));
        return [$seenAny ? $tagIds : null, $seenAny ? $newTags : null];
    }

    // Sync modules (full replace) – null = noop, [] = detach all
    private function syncQuizModules(int $quizId, ?array $moduleIds): void
    {
        Log::debug('[syncQuizModules]', ['quizId'=>$quizId, 'module_ids'=>$moduleIds]);
        if ($moduleIds === null) return;

        DB::table('quiz_modules')->where('id_quiz', $quizId)->delete();
        if (!empty($moduleIds)) {
            $now = now();
            DB::table('quiz_modules')->insert(
                array_map(fn($mid)=>[
                    'id_quiz'=>$quizId,'id_module'=>(int)$mid,
                    'created_at'=>$now,'updated_at'=>$now
                ], $moduleIds)
            );
        }
    }

    // Sync tags (full replace) – nulls = noop, [] = detach all
    private function syncQuizTags(int $quizId, array $tagIds = null, array $newTags = null): void
    {
        Log::debug('[syncQuizTags]', ['quizId'=>$quizId, 'tag_ids'=>$tagIds, 'new_tags'=>$newTags]);

        $tagIds  = is_array($tagIds) ? array_values(array_unique(array_map('intval', $tagIds))) : [];
        $newTags = is_array($newTags) ? $newTags : [];

        $createdIds = [];
        foreach ($newTags as $name) {
            $name = trim((string)$name);
            if ($name === '') continue;
            $tag = Tag::firstOrCreate(['tag_name'=>$name]);
            $createdIds[] = (int)$tag->id;
        }
        $all = array_unique(array_merge($tagIds, $createdIds));

        DB::table('quiz_tags')->where('id_quiz', $quizId)->delete();
        if (!empty($all)) {
            $now = now();
            DB::table('quiz_tags')->insert(
                array_map(fn($tid)=>[
                    'id_quiz'=>$quizId,'id_tag'=>$tid,
                    'created_at'=>$now,'updated_at'=>$now
                ], $all)
            );
        }
    }

    /* --- Optional cleanup: remove deleted questions/answers on update --- */

    // Delete questions/answers that are not referenced anymore
    private function cleanupRemovedQA(int $quizId, array $keptQuestionIds, array $keptAnswerIdsByQ): void
    {
        // Delete answers not kept for each kept question
        foreach ($keptAnswerIdsByQ as $qid => $keptAIds) {
            DB::table('answers')
              ->where('id_question', $qid)
              ->whereNotIn('id_answer', $keptAIds ?: [-1])
              ->delete();
        }

        // Delete questions not kept
        DB::table('questions')
          ->where('id_quiz', $quizId)
          ->whereNotIn('id_question', $keptQuestionIds ?: [-1])
          ->delete();
    }

    /* --- LIST --- */
    public function index(Request $request)
    {
        $langCode   = $request->query('lang', 'fr');
        $langId     = $this->langId($langCode);
        $onlyActive = $request->boolean('only_active');

        $q = DB::table('quiz as q')
            ->leftJoin('translations as t_title', function ($j) use ($langId) {
                $j->on('t_title.quiz_id','=','q.id_quiz')
                  ->where('t_title.lang','=',$langId)
                  ->where('t_title.field_name','=','title');
            })
            ->leftJoin('translations as t_desc', function ($j) use ($langId) {
                $j->on('t_desc.quiz_id','=','q.id_quiz')
                  ->where('t_desc.lang','=',$langId)
                  ->where('t_desc.field_name','=','quiz_description');
            })
            ->leftJoin('active_quiz as aq', function ($j) use ($langId) {
                $j->on('aq.id_quiz','=','q.id_quiz')
                  ->where('aq.lang','=',$langId);
            })
            ->select([
                'q.id_quiz as id',
                DB::raw('COALESCE(t_title.element_text, "") as title'),
                DB::raw('COALESCE(t_desc.element_text, "") as quiz_description'),
                'q.cover_image_url', // cover from quiz table
                DB::raw('COALESCE(aq.is_active, 0) as is_active'),
                'q.created_at','q.updated_at',
            ]);

        if ($onlyActive) $q->where('aq.is_active','=',1);

        return response()->json($q->get());
    }

    /* --- PUBLIC SHOW (rejects inactive) --- */
    public function show(Request $request, $id)
    {
        $langCode = $request->query('lang', 'fr');
        $langId   = $this->langId($langCode);

        $quiz = DB::table('quiz as q')
            ->leftJoin('translations as t_title', function ($j) use ($langId) {
                $j->on('t_title.quiz_id','=','q.id_quiz')
                  ->where('t_title.lang','=',$langId)
                  ->where('t_title.field_name','=','title');
            })
            ->leftJoin('translations as t_desc', function ($j) use ($langId) {
                $j->on('t_desc.quiz_id','=','q.id_quiz')
                  ->where('t_desc.lang','=',$langId)
                  ->where('t_desc.field_name','=','quiz_description');
            })
            ->leftJoin('active_quiz as aq', function ($j) use ($langId) {
                $j->on('aq.id_quiz','=','q.id_quiz')
                  ->where('aq.lang','=',$langId);
            })
            ->where('q.id_quiz',$id)
            ->select([
                'q.id_quiz as id',
                DB::raw('COALESCE(t_title.element_text, "") as title'),
                DB::raw('COALESCE(t_desc.element_text, "") as quiz_description'),
                'q.cover_image_url',
                DB::raw('COALESCE(aq.is_active, 0) as is_active'),
                'q.created_at','q.updated_at',
            ])
            ->first();

        if (!$quiz) return response()->json(['message'=>'Quiz not found'], 404);
        if (!$quiz->is_active) return response()->json(['message'=>'Quiz is inactive'], 403);

        $questions = DB::table('questions as qu')
            ->leftJoin('translations as tq', function ($j) use ($langId) {
                $j->on('tq.question_id','=','qu.id_question')
                  ->where('tq.lang','=',$langId)
                  ->where('tq.field_name','=','question_title');
            })
            ->leftJoin('translations as dq', function ($j) use ($langId) {
                $j->on('dq.question_id','=','qu.id_question')
                  ->where('dq.lang','=',$langId)
                  ->where('dq.field_name','=','question_description');
            })
            ->where('qu.id_quiz',$id)
            ->orderBy('qu.order')->orderBy('qu.id_question')
            ->select([
                'qu.id_question as id',
                'qu.id_type',
                'qu.order',
                DB::raw('COALESCE(tq.element_text, "") as title'),
                DB::raw('COALESCE(dq.element_text, "") as description'),
            ])->get();

        $questions = $questions->map(function ($qrow) use ($langId) {
            $answers = DB::table('answers as a')
                ->leftJoin('translations as tr', function ($j) use ($langId) {
                    $j->on('tr.answer_id','=','a.id_answer')
                      ->where('tr.lang','=',$langId)
                      ->where('tr.field_name','=','answer_text');
                })
                ->where('a.id_question',$qrow->id)
                ->orderBy('a.id_answer')
                ->select([
                    'a.id_answer as id',
                    'a.is_correct',
                    DB::raw('COALESCE(tr.element_text, "") as answer_text'),
                ])->get();

            $qrow->answers = $answers;
            return $qrow;
        });

        return response()->json(['quiz'=>$quiz, 'questions'=>$questions]);
    }

    /* --- CREATE (multi-lang + mono-lang) --- */
    public function store(Request $request)
    {
        $languagesRaw = $request->input('languages');
        $languages = is_string($languagesRaw) ? (json_decode($languagesRaw, true) ?? []) : $languagesRaw;

        // Multi-language payload
        if (is_array($languages)) {
            DB::beginTransaction();
            try {
                $quizId = (int) DB::table('quiz')->insertGetId([
                    'created_at'=>now(), 'updated_at'=>now(),
                ]);

                // Cover: prefer uploaded file, else first non-empty URL found
                $coverUrl = null;
                if ($request->hasFile('cover_image')) {
                    $coverUrl = url(Storage::url($request->file('cover_image')->store('quiz-cards','public')));
                } else {
                    foreach ($languages as $L) {
                        if (!empty($L['cover_image_url'])) { $coverUrl = $L['cover_image_url']; break; }
                    }
                }
                if ($coverUrl !== null) {
                    DB::table('quiz')->where('id_quiz',$quizId)->update([
                        'cover_image_url'=>$coverUrl, 'updated_at'=>now(),
                    ]);
                }

                // Build QA skeleton from a reference language (first with questions)
                $ref = collect($languages)->first(fn($L)=>!empty($L['questions'])) ?? ($languages[0] ?? []);
                $qMap = []; $aMap = [];
                $order = 0;
                foreach (($ref['questions'] ?? []) as $idxQ => $q) {
                    $correct = $q['correctIndices'] ?? [];
                    $idType  = isset($q['id_type']) ? (int)$q['id_type'] : ((count($correct)>1)?2:1);

                    $qid = (int) DB::table('questions')->insertGetId([
                        'id_quiz'=>$quizId, 'id_type'=>$idType, 'order'=>$order++,
                        'created_at'=>now(), 'updated_at'=>now(),
                    ]);
                    $qMap[$idxQ] = $qid;

                    $aMap[$idxQ] = [];
                    foreach (array_values($q['options'] ?? []) as $idxA => $text) {
                        $aid = (int) DB::table('answers')->insertGetId([
                            'id_question'=>$qid,
                            'is_correct'=> in_array($idxA, $correct, true) ? 1 : 0,
                            'created_at'=>now(), 'updated_at'=>now(),
                        ]);
                        $aMap[$idxQ][$idxA] = $aid;
                    }
                }

                // Write translations + active per language
                foreach ($languages as $L) {
                    $langId = $this->langId($L['code'] ?? 'fr');

                    $this->upsertQuizTr($langId, $quizId, 'title',            (string)($L['title'] ?? ''));
                    $this->upsertQuizTr($langId, $quizId, 'quiz_description', (string)($L['quiz_description'] ?? ''));
                    $this->upsertActiveQuiz($quizId, $langId, (bool)($L['is_active'] ?? false));

                    foreach (($L['questions'] ?? []) as $idxQ => $q) {
                        if (!array_key_exists($idxQ, $qMap)) continue;
                        $qid = $qMap[$idxQ];

                        $this->upsertQuestionTr($langId, $qid, 'question_title',       (string)($q['title'] ?? ''));
                        $this->upsertQuestionTr($langId, $qid, 'question_description', (string)($q['description'] ?? ''));

                        foreach (array_values($q['options'] ?? []) as $idxA => $text) {
                            if (!isset($aMap[$idxQ][$idxA])) continue;
                            $aid = $aMap[$idxQ][$idxA];
                            $this->upsertAnswerTr($langId, $aid, (string)($text ?? ''));
                        }
                    }
                }

                // Aggregate modules/tags across all languages (single sync)
                $allModuleIds = $this->collectModuleIdsFromLanguages($languages);
                [$allTagIds, $allNewTags] = $this->collectTagsFromLanguages($languages);
                $this->syncQuizModules($quizId, $allModuleIds);
                $this->syncQuizTags($quizId, $allTagIds ?? [], $allNewTags ?? []);

                // Mapping back to FE
                $mapping = [
                    'quiz_id'  => $quizId,
                    'questions'=> array_map(function($idxQ) use ($qMap,$aMap){
                        return [
                            'index'=>$idxQ,
                            'id_question'=>$qMap[$idxQ],
                            'answers'=>array_map(function($idxA) use ($idxQ,$aMap){
                                return ['index'=>$idxA,'id_answer'=>$aMap[$idxQ][$idxA]];
                            }, array_keys($aMap[$idxQ] ?? [])),
                        ];
                    }, array_keys($qMap)),
                ];

                DB::commit();
                return response()->json(['id'=>$quizId, 'mapping'=>$mapping], 201);

            } catch (\Throwable $e) {
                DB::rollBack();
                return response()->json(['message'=>'Error while creating the quiz','error'=>$e->getMessage()], 500);
            }
        }

        // Mono-language payload
        $validated = $request->validate([
            'lang'             => 'required|string|size:2',
            'title'            => 'required|string|max:255',
            'quiz_description' => 'nullable|string',
            'cover_image_url'  => 'nullable|url',
            'is_active'        => 'boolean',
        ]);

        $coverUrl = $request->hasFile('cover_image')
            ? url(Storage::url($request->file('cover_image')->store('quiz-cards','public')))
            : ($validated['cover_image_url'] ?? null);

        $questions = $request->input('questions');
        if (is_string($questions)) $questions = json_decode($questions, true) ?? [];
        if (!is_array($questions)) $questions = [];

        DB::beginTransaction();
        try {
            $quizId = (int) DB::table('quiz')->insertGetId([
                'cover_image_url'=>$coverUrl,
                'created_at'=>now(),'updated_at'=>now(),
            ]);
            $langId = $this->langId($validated['lang']);

            $this->upsertQuizTr($langId, $quizId, 'title',            (string)$validated['title']);
            $this->upsertQuizTr($langId, $quizId, 'quiz_description', (string)($validated['quiz_description'] ?? ''));
            $this->upsertActiveQuiz($quizId, $langId, (bool)($validated['is_active'] ?? false));

            $order = 0;
            foreach ($questions as $q) {
                $correct = $q['correctIndices'] ?? [];
                $idType  = isset($q['id_type']) ? (int)$q['id_type'] : ((count($correct)>1)?2:1);

                $qid = (int) DB::table('questions')->insertGetId([
                    'id_quiz'=>$quizId,'id_type'=>$idType,'order'=>$order++,
                    'created_at'=>now(),'updated_at'=>now(),
                ]);

                $this->upsertQuestionTr($langId, $qid, 'question_title',       (string)($q['title'] ?? ''));
                $this->upsertQuestionTr($langId, $qid, 'question_description', (string)($q['description'] ?? ''));

                foreach (array_values($q['options'] ?? []) as $idx => $text) {
                    $aid = (int) DB::table('answers')->insertGetId([
                        'id_question'=>$qid,
                        'is_correct'=> in_array($idx, $correct, true) ? 1 : 0,
                        'created_at'=>now(),'updated_at'=>now(),
                    ]);
                    $this->upsertAnswerTr($langId, $aid, (string)($text ?? ''));
                }
            }

            // Optional mono-lang tags/modules (read from request if present)
            $m = $request->input('module_ids', null);
            $t = $request->input('tag_ids', null);
            $n = $request->input('new_tags', null);
            $this->syncQuizModules($quizId, is_array($m) ? $m : null);
            $this->syncQuizTags($quizId, is_array($t) ? $t : [], is_array($n) ? $n : []);

            DB::commit();
            return response()->json(['id'=>$quizId], 201);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message'=>'Error while creating the quiz','error'=>$e->getMessage()], 500);
        }
    }

    /* --- UPDATE (multi-lang + mono-lang) --- */
    public function update(Request $request, $id)
    {
        $languagesRaw = $request->input('languages');
        $languages = is_string($languagesRaw) ? (json_decode($languagesRaw, true) ?? []) : $languagesRaw;

        // Multi-language payload
        if (is_array($languages)) {
            $quiz = DB::table('quiz')->where('id_quiz',$id)->first();
            if (!$quiz) return response()->json(['message'=>'Quiz not found'], 404);

            DB::beginTransaction();
            try {
                // Cover override if provided
                $coverUrl = null;
                if ($request->hasFile('cover_image')) {
                    $coverUrl = url(Storage::url($request->file('cover_image')->store('quiz-cards','public')));
                } else {
                    foreach ($languages as $L) {
                        if (!empty($L['cover_image_url'])) { $coverUrl = $L['cover_image_url']; break; }
                    }
                }
                if ($coverUrl !== null) {
                    DB::table('quiz')->where('id_quiz',$id)->update([
                        'cover_image_url'=>$coverUrl, 'updated_at'=>now(),
                    ]);
                }

                // Existing questions (keyed by id)
                $existingQ = DB::table('questions')->where('id_quiz',$id)
                    ->orderBy('order')->orderBy('id_question')->get()->keyBy('id_question');

                // Reference language for structure diff
                $ref = collect($languages)->first(fn($L)=>!empty($L['questions'])) ?? ($languages[0] ?? []);
                $qMap = []; $aMap = [];
                $keptQ = []; $keptAByQ = [];
                $order = 0;

                foreach (($ref['questions'] ?? []) as $idxQ => $q) {
                    $correct = $q['correctIndices'] ?? [];
                    $idType  = isset($q['id_type']) ? (int)$q['id_type'] : ((count($correct)>1)?2:1);

                    // Reuse question if provided and exists, else create
                    if (!empty($q['id_question']) && $existingQ->has((int)$q['id_question'])) {
                        $qid = (int)$q['id_question'];
                        DB::table('questions')->where('id_question',$qid)->update([
                            'id_type'=>$idType,'order'=>$order++,'updated_at'=>now(),
                        ]);
                    } else {
                        $qid = (int) DB::table('questions')->insertGetId([
                            'id_quiz'=>(int)$id, 'id_type'=>$idType, 'order'=>$order++,
                            'created_at'=>now(), 'updated_at'=>now(),
                        ]);
                    }
                    $qMap[$idxQ] = $qid;
                    $keptQ[] = $qid;

                    // Sync answers by index (reuse incoming id when possible)
                    $aMap[$idxQ] = [];
                    $opts = $q['options'] ?? [];
                    $answerIds = $q['answerIds'] ?? [];
                    $existingA = DB::table('answers')->where('id_question',$qid)->orderBy('id_answer')->get();

                    $keptAByQ[$qid] = [];
                    foreach (array_values($opts) as $idxA => $text) {
                        $isCorrect  = in_array($idxA, ($q['correctIndices'] ?? []), true) ? 1 : 0;
                        $incomingId = $answerIds[$idxA] ?? null;

                        if ($incomingId && DB::table('answers')->where('id_answer',$incomingId)->exists()) {
                            $aid = (int)$incomingId;
                            DB::table('answers')->where('id_answer',$aid)->update([
                                'is_correct'=>$isCorrect,'updated_at'=>now(),
                            ]);
                        } else {
                            $existingRow = $existingA[$idxA] ?? null; // by position
                            if ($existingRow) {
                                $aid = (int)$existingRow->id_answer;
                                DB::table('answers')->where('id_answer',$aid)->update([
                                    'is_correct'=>$isCorrect,'updated_at'=>now(),
                                ]);
                            } else {
                                $aid = (int) DB::table('answers')->insertGetId([
                                    'id_question'=>$qid,'is_correct'=>$isCorrect,
                                    'created_at'=>now(),'updated_at'=>now(),
                                ]);
                            }
                        }
                        $aMap[$idxQ][$idxA] = $aid;
                        $keptAByQ[$qid][] = $aid;
                    }
                }

                // Write translations + active per language
                foreach ($languages as $L) {
                    $langId = $this->langId($L['code'] ?? 'fr');

                    $this->upsertQuizTr($langId, (int)$id, 'title',            (string)($L['title'] ?? ''));
                    $this->upsertQuizTr($langId, (int)$id, 'quiz_description', (string)($L['quiz_description'] ?? ''));
                    $this->upsertActiveQuiz((int)$id, $langId, (bool)($L['is_active'] ?? false));

                    foreach (($L['questions'] ?? []) as $idxQ => $q) {
                        if (!array_key_exists($idxQ, $qMap)) continue;
                        $qid = $qMap[$idxQ];

                        $this->upsertQuestionTr($langId, $qid, 'question_title',       (string)($q['title'] ?? ''));
                        $this->upsertQuestionTr($langId, $qid, 'question_description', (string)($q['description'] ?? ''));

                        foreach (array_values($q['options'] ?? []) as $idxA => $text) {
                            if (!isset($aMap[$idxQ][$idxA])) continue;
                            $aid = $aMap[$idxQ][$idxA];
                            $this->upsertAnswerTr($langId, $aid, (string)($text ?? ''));
                        }
                    }
                }

                // Cleanup removed Q/A to avoid endless growth
                $this->cleanupRemovedQA((int)$id, $keptQ, $keptAByQ);

                // Aggregate modules/tags across all languages (single sync)
                $allModuleIds = $this->collectModuleIdsFromLanguages($languages);
                [$allTagIds, $allNewTags] = $this->collectTagsFromLanguages($languages);
                $this->syncQuizModules((int)$id, $allModuleIds);
                $this->syncQuizTags((int)$id, $allTagIds ?? [], $allNewTags ?? []);

                // Mapping back to FE
                $mapping = [
                    'quiz_id'  => (int)$id,
                    'questions'=> array_map(function($idxQ) use ($qMap,$aMap){
                        return [
                            'index'=>$idxQ,
                            'id_question'=>$qMap[$idxQ],
                            'answers'=>array_map(function($idxA) use ($idxQ,$aMap){
                                return ['index'=>$idxA,'id_answer'=>$aMap[$idxQ][$idxA]];
                            }, array_keys($aMap[$idxQ] ?? [])),
                        ];
                    }, array_keys($qMap)),
                ];

                DB::commit();
                return response()->json(['id'=>(int)$id, 'mapping'=>$mapping], 200);

            } catch (\Throwable $e) {
                DB::rollBack();
                return response()->json(['message'=>'Error while updating the quiz','error'=>$e->getMessage()], 500);
            }
        }

        // Mono-language payload
        $validated = $request->validate([
            'lang'             => 'required|string|size:2',
            'title'            => 'required|string|max:255',
            'quiz_description' => 'nullable|string',
            'cover_image_url'  => 'nullable|url',
            'is_active'        => 'boolean',
        ]);

        $quiz = DB::table('quiz')->where('id_quiz',$id)->first();
        if (!$quiz) return response()->json(['message'=>'Quiz not found'], 404);

        $coverUrl = $request->hasFile('cover_image')
            ? url(Storage::url($request->file('cover_image')->store('quiz-cards','public')))
            : ($validated['cover_image_url'] ?? null);

        if ($coverUrl !== null) {
            DB::table('quiz')->where('id_quiz',$id)->update([
                'cover_image_url'=>$coverUrl, 'updated_at'=>now(),
            ]);
        }

        $questions = $request->input('questions');
        if (is_string($questions)) $questions = json_decode($questions, true) ?? [];
        if (!is_array($questions)) $questions = [];

        DB::beginTransaction();
        try {
            $langId = $this->langId($validated['lang']);

            $this->upsertQuizTr($langId, (int)$id, 'title',            (string)$validated['title']);
            $this->upsertQuizTr($langId, (int)$id, 'quiz_description', (string)($validated['quiz_description'] ?? ''));
            $this->upsertActiveQuiz((int)$id, $langId, (bool)($validated['is_active'] ?? false));

            $existingQ = DB::table('questions')->where('id_quiz',$id)->orderBy('order')->get()->keyBy('id_question');
            $qKept = []; $aKeptByQ = [];
            $order = 0;

            foreach ($questions as $q) {
                $correct = $q['correctIndices'] ?? [];
                $idType  = isset($q['id_type']) ? (int)$q['id_type'] : ((count($correct)>1)?2:1);

                if (!empty($q['id_question']) && $existingQ->has((int)$q['id_question'])) {
                    $qid = (int)$q['id_question'];
                    DB::table('questions')->where('id_question',$qid)->update([
                        'id_type'=>$idType,'order'=>$order++,'updated_at'=>now(),
                    ]);
                } else {
                    $qid = (int) DB::table('questions')->insertGetId([
                        'id_quiz'=>(int)$id,'id_type'=>$idType,'order'=>$order++,
                        'created_at'=>now(),'updated_at'=>now(),
                    ]);
                }
                $qKept[] = $qid;

                $opts = $q['options'] ?? [];
                $answerIds = $q['answerIds'] ?? [];
                $existingA = DB::table('answers')->where('id_question',$qid)->orderBy('id_answer')->get();

                $aKeptByQ[$qid] = [];
                foreach (array_values($opts) as $idx => $text) {
                    $isCorrect = in_array($idx, $correct, true) ? 1 : 0;
                    $incomingId = $answerIds[$idx] ?? null;

                    if ($incomingId && DB::table('answers')->where('id_answer',$incomingId)->exists()) {
                        $aid = (int)$incomingId;
                        DB::table('answers')->where('id_answer',$aid)->update([
                            'is_correct'=>$isCorrect,'updated_at'=>now(),
                        ]);
                    } else {
                        $row = $existingA[$idx] ?? null;
                        if ($row) {
                            $aid = (int)$row->id_answer;
                            DB::table('answers')->where('id_answer',$aid)->update([
                                'is_correct'=>$isCorrect,'updated_at'=>now(),
                            ]);
                        } else {
                            $aid = (int) DB::table('answers')->insertGetId([
                                'id_question'=>$qid,'is_correct'=>$isCorrect,
                                'created_at'=>now(),'updated_at'=>now(),
                            ]);
                        }
                    }
                    $this->upsertAnswerTr($langId, $aid, (string)($text ?? ''));
                    $aKeptByQ[$qid][] = $aid;
                }

                $this->upsertQuestionTr($langId, $qid, 'question_title',       (string)($q['title'] ?? ''));
                $this->upsertQuestionTr($langId, $qid, 'question_description', (string)($q['description'] ?? ''));
            }

            // Cleanup removed Q/A
            $this->cleanupRemovedQA((int)$id, $qKept, $aKeptByQ);

            // Optional mono-lang modules/tags if present
            $m = $request->input('module_ids', null);
            $t = $request->input('tag_ids', null);
            $n = $request->input('new_tags', null);
            $this->syncQuizModules((int)$id, is_array($m) ? $m : null);
            $this->syncQuizTags((int)$id, is_array($t) ? $t : [], is_array($n) ? $n : []);

            DB::commit();
            return response()->json(['id'=>(int)$id], 200);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message'=>'Error while updating the quiz','error'=>$e->getMessage()], 500);
        }
    }

    /* --- DELETE --- */
    public function destroy($id)
    {
        $quiz = Quiz::findOrFail($id);

        DB::transaction(function () use ($quiz) {
            $quiz->modules()->detach();
            $quiz->tags()->detach();

            foreach ($quiz->questions as $q) {
                $q->answers()->delete();
            }
            $quiz->questions()->delete();
            $quiz->delete();
        });

        return response()->noContent();
    }

    /* --- EDITOR VIEW (multi-lang snapshot for the UI) --- */
    public function editor(Request $request, $id)
    {
        $quiz = DB::table('quiz')->where('id_quiz',$id)->first();
        if (!$quiz) return response()->json(['message'=>'Quiz not found'], 404);

        // Structure
        $questions = DB::table('questions')
            ->where('id_quiz',$id)
            ->orderBy('order')->orderBy('id_question')
            ->select(['id_question','id_type','order'])
            ->get();

        $answersByQ = [];
        foreach ($questions as $q) {
            $answersByQ[$q->id_question] = DB::table('answers')
                ->where('id_question',$q->id_question)
                ->orderBy('id_answer')
                ->select(['id_answer','is_correct'])
                ->get();
        }

        // All langs snapshot
        $langs = DB::table('lang')->orderBy('id')->get();
        $translations = [];
        foreach ($langs as $L) {
            $langId = (int)$L->id;
            $langCode = (string)$L->lang;

            $title = DB::table('translations')->where([
                ['quiz_id','=',$id],['lang','=',$langId],
                ['element_type','=','quiz'],['field_name','=','title'],
            ])->value('element_text') ?? '';

            $desc = DB::table('translations')->where([
                ['quiz_id','=',$id],['lang','=',$langId],
                ['element_type','=','quiz'],['field_name','=','quiz_description'],
            ])->value('element_text') ?? '';

            $isActive = (int) DB::table('active_quiz')
                ->where('id_quiz',$id)->where('lang',$langId)
                ->value('is_active') ?? 0;

            $qs = [];
            foreach ($questions as $q) {
                $qid = (int)$q->id_question;

                $qTitle = DB::table('translations')->where([
                    ['question_id','=',$qid],['lang','=',$langId],
                    ['element_type','=','question'],['field_name','=','question_title'],
                ])->value('element_text') ?? '';

                $qDesc = DB::table('translations')->where([
                    ['question_id','=',$qid],['lang','=',$langId],
                    ['element_type','=','question'],['field_name','=','question_description'],
                ])->value('element_text') ?? '';

                $as = [];
                foreach ($answersByQ[$qid] as $a) {
                    $aid = (int)$a->id_answer;
                    $aText = DB::table('translations')->where([
                        ['answer_id','=',$aid],['lang','=',$langId],
                        ['element_type','=','answer'],['field_name','=','answer_text'],
                    ])->value('element_text') ?? '';
                    $as[] = [
                        'id'          => $aid,
                        'id_answer'   => $aid,
                        'answer_text' => $aText,
                        'is_correct'  => ((int)$a->is_correct === 1),
                    ];
                }

                $qs[] = [
                    'id'                   => $qid,
                    'id_question'          => $qid,
                    'id_type'              => (int)$q->id_type,
                    'order'                => (int)$q->order,
                    'question_titre'       => $qTitle,
                    'question_description' => $qDesc,
                    'answers'              => $as,
                ];
            }

            // cover is stored in quiz table for all langs
            $cover = $quiz->cover_image_url ?? '';

            $translations[] = [
                'lang'             => $langCode,
                'id'               => (int)$id,
                'title'            => $title,
                'quiz_description' => $desc,
                'cover_image_url'  => $cover,
                'is_active'        => (bool)$isActive,
                'questions'        => $qs,
            ];
        }

        // Modules / Tags assignments
        $modules = DB::table('modules as m')
            ->join('quiz_modules as qm','qm.id_module','=','m.id')
            ->where('qm.id_quiz',$id)
            ->select(['m.id','m.module_name'])
            ->get();

        $tags = DB::table('tags as t')
            ->join('quiz_tags as qt','qt.id_tag','=','t.id')
            ->where('qt.id_quiz',$id)
            ->select(['t.id','t.tag_name as name'])
            ->get();

        return response()->json([
            'id'           => (int)$id,
            'translations' => $translations,
            'modules'      => $modules,
            'tags'         => $tags,
        ]);
    }
}
