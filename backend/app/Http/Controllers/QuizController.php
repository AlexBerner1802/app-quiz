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

    // Normalizes a language code (e.g., "fr-CH" -> "fr") and forces it onto the supported list.
    private function normalizeLang(?string $code): string
    {
        $supported = ['en','fr','de','it'];
        $raw = strtolower((string)($code ?? 'en'));
        $base = explode('-', $raw)[0]; // "en-US" -> "en"
        return in_array($base, $supported, true) ? $base : 'en';
    }

    // Upsert quiz translation for a language code
    private function upsertQuizTr(string $langCode, int $quizId, string $field, string $text): void
    {
        DB::table('translations')->upsert([[
            'lang'          => $langCode,
            'element_type'  => 'quiz',
            'field_name'    => $field,
            'quiz_id'       => $quizId,
            'element_text'  => $text,
            'created_at'    => now(),
            'updated_at'    => now(),
        ]], ['lang','field_name','quiz_id'], ['element_text','updated_at']);
    }

    // Upsert translation of question for a language code
    private function upsertQuestionTr(string $langCode, int $questionId, string $field, ?string $text): void
    {
        DB::table('translations')->upsert([[
            'lang'          => $langCode,
            'element_type'  => 'question',
            'field_name'    => $field,
            'question_id'   => $questionId,
            'element_text'  => $text ?? '',
            'created_at'    => now(),
            'updated_at'    => now(),
        ]], ['lang','field_name','question_id'], ['element_text','updated_at']);
    }

    // Upsert translation of the answer (answer_text) for a language code
    private function upsertAnswerTr(string $langCode, int $answerId, string $text): void
    {
        DB::table('translations')->upsert([[
            'lang'          => $langCode,
            'element_type'  => 'answer',
            'field_name'    => 'answer_text',
            'answer_id'     => $answerId,
            'element_text'  => $text,
            'created_at'    => now(),
            'updated_at'    => now(),
        ]], ['lang','field_name','answer_id'], ['element_text','updated_at']);
    }

    // Upsert activation by language (code)
    private function upsertActiveQuiz(int $quizId, string $langCode, bool $isActive): void
    {
        DB::table('active_quiz')->upsert([[
            'id_quiz'    => $quizId,
            'lang'       => $langCode,
            'is_active'  => $isActive ? 1 : 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]], ['id_quiz','lang'], ['is_active','updated_at']);
    }


    private function collectModuleIdsFromLanguages(array $languages): ?array
    {
        $all = []; $seen = false;
        foreach ($languages as $L) {
            if (array_key_exists('module_ids', $L)) {
                $seen = true;
                foreach ((array)($L['module_ids'] ?? []) as $v) $all[] = (int)$v;
            }
        }
        if (!$seen) return null;
        return array_values(array_unique(array_filter($all, fn($v)=>$v>0)));
    }

    private function collectTagsFromLanguages(array $languages): array
    {
        $tagIds = []; $newTags = []; $seenAny = false;
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


    private function cleanupRemovedQA(int $quizId, array $keptQuestionIds, array $keptAnswerIdsByQ): void
    {
        foreach ($keptAnswerIdsByQ as $qid => $keptAIds) {
            DB::table('answers')
              ->where('id_question', $qid)
              ->whereNotIn('id_answer', $keptAIds ?: [-1])
              ->delete();
        }

        DB::table('questions')
          ->where('id_quiz', $quizId)
          ->whereNotIn('id_question', $keptQuestionIds ?: [-1])
          ->delete();
    }

    public function index(Request $request)
    {
        $lang = $this->normalizeLang($request->input('lang', app()->getLocale()));

        $quizzes = Quiz::query()
            ->with([
                'tags:id,tag_name',
                'modules:id,module_name',
                'translations' => function($q) use ($lang) {
                    $q->where('element_type', 'quiz')->where('lang', $lang);
                },
            ])
            ->get()
            ->map(function($quiz) use ($lang, $request) {
                $quizId = (int) ($quiz->id_quiz ?? $quiz->id ?? 0);

                $translations = $quiz->translations->keyBy('field_name');
                $quiz->title            = $translations['title']->element_text ?? null;
                $quiz->quiz_description = $translations['quiz_description']->element_text ?? null;
                $quiz->cover_image_url  = $translations['cover_image_url']->element_text ?? $quiz->cover_image_url;

                $quiz->is_active = DB::table('active_quiz')
                    ->where('id_quiz', $quizId)
                    ->where('lang', $lang)
                    ->where('is_active', 1)
                    ->exists();

                return $quiz;
            });

        if ($request->boolean('only_active')) {
            $quizzes = $quizzes->filter(fn($q) => $q->is_active);
        }

        return response()->json($quizzes->values());
    }


    public function show(Request $request, $id)
    {
        $lang = $this->normalizeLang($request->input('lang', app()->getLocale()));

        // If inactive for this language -> 403
        $isActive = DB::table('active_quiz')
            ->where('id_quiz', $id)
            ->where('lang', $lang)
            ->where('is_active', 1)
            ->exists();
        if (!$isActive) {
            return response()->json(['message' => 'Quiz is inactive'], 403);
        }

        // Basic quiz fields
        $quiz = DB::table('quiz')->where('id_quiz', $id)->first();
        if (!$quiz) return response()->json(['message'=>'Quiz not found'], 404);

        // Quiz translations
        $title = DB::table('translations')->where([
            ['quiz_id','=',$id],['lang','=',$lang],
            ['element_type','=','quiz'],['field_name','=','title'],
        ])->value('element_text') ?? '';

        $desc = DB::table('translations')->where([
            ['quiz_id','=',$id],['lang','=',$lang],
            ['element_type','=','quiz'],['field_name','=','quiz_description'],
        ])->value('element_text') ?? '';

        $cover = DB::table('translations')->where([
            ['quiz_id','=',$id],['lang','=',$lang],
            ['element_type','=','quiz'],['field_name','=','cover_image_url'],
        ])->value('element_text') ?? ($quiz->cover_image_url ?? '');

        // Questions and answers (translated texts)
        $questions = DB::table('questions')
            ->where('id_quiz', $id)
            ->orderBy('order')->orderBy('id_question')
            ->get();

        $outQuestions = [];
        foreach ($questions as $q) {
            $qid = (int)$q->id_question;

            $qTitle = DB::table('translations')->where([
                ['question_id','=',$qid],['lang','=',$lang],
                ['element_type','=','question'],['field_name','=','question_title'],
            ])->value('element_text') ?? '';

            $qDesc = DB::table('translations')->where([
                ['question_id','=',$qid],['lang','=',$lang],
                ['element_type','=','question'],['field_name','=','question_description'],
            ])->value('element_text') ?? '';

            $answers = DB::table('answers')->where('id_question',$qid)->orderBy('id_answer')->get();
            $outAnswers = [];
            foreach ($answers as $a) {
                $aid = (int)$a->id_answer;
                $aText = DB::table('translations')->where([
                    ['answer_id','=',$aid],['lang','=',$lang],
                    ['element_type','=','answer'],['field_name','=','answer_text'],
                ])->value('element_text') ?? '';
                $outAnswers[] = [
                    'id_answer'   => $aid,
                    'answer_text' => $aText,
                    'is_correct'  => ((int)$a->is_correct === 1),
                ];
            }

            $outQuestions[] = [
                'id_question'          => $qid,
                'id_type'              => (int)$q->id_type,
                'order'                => (int)$q->order,
                'question_titre'       => $qTitle,
                'question_description' => $qDesc,
                'answers'              => $outAnswers,
            ];
        }

        return response()->json([
            'quiz' => [
                'id'               => (int)$id,
                'title'            => $title,
                'quiz_description' => $desc,
                'cover_image_url'  => $cover,
                'is_active'        => true,
            ],
            'questions' => $outQuestions,
        ]);
    }

    public function store(Request $request)
    {
        $languagesRaw = $request->input('languages');
        $languages = is_string($languagesRaw) ? (json_decode($languagesRaw, true) ?? []) : $languagesRaw;

        // MULTI (accepted but ignored any notion of language ID; code only)
        if (is_array($languages) && !empty($languages)) {
            DB::beginTransaction();
            try {
                $quizId = (int) DB::table('quiz')->insertGetId([
                    'created_at'=>now(), 'updated_at'=>now(),
                ]);

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

                // QA skeleton from the first language with questions
                $ref = collect($languages)->first(fn($L)=>!empty($L['questions'])) ?? ($languages[0] ?? []);
                $qMap = []; $aMap = []; $order = 0;
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

                // Writing TRs + activation, via code
                foreach ($languages as $L) {
                    $code = $this->normalizeLang($L['code'] ?? 'en');

                    $this->upsertQuizTr($code, $quizId, 'title',            (string)($L['title'] ?? ''));
                    $this->upsertQuizTr($code, $quizId, 'quiz_description', (string)($L['quiz_description'] ?? ''));
                    $this->upsertActiveQuiz($quizId, $code, (bool)($L['is_active'] ?? false));

                    foreach (($L['questions'] ?? []) as $idxQ => $q) {
                        if (!array_key_exists($idxQ, $qMap)) continue;
                        $qid = $qMap[$idxQ];

                        $this->upsertQuestionTr($code, $qid, 'question_title',       (string)($q['title'] ?? ''));
                        $this->upsertQuestionTr($code, $qid, 'question_description', (string)($q['description'] ?? ''));

                        foreach (array_values($q['options'] ?? []) as $idxA => $text) {
                            if (!isset($aMap[$idxQ][$idxA])) continue;
                            $aid = $aMap[$idxQ][$idxA];
                            $this->upsertAnswerTr($code, $aid, (string)($text ?? ''));
                        }
                    }
                }

                // Modules / Tags
                $allModuleIds = $this->collectModuleIdsFromLanguages($languages);
                [$allTagIds, $allNewTags] = $this->collectTagsFromLanguages($languages);
                $this->syncQuizModules($quizId, $allModuleIds);
                $this->syncQuizTags($quizId, $allTagIds ?? [], $allNewTags ?? []);

                // Mapping FE
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

        // MONO
        $validated = $request->validate([
            'lang'             => 'required|string|size:2',
            'title'            => 'required|string|max:255',
            'quiz_description' => 'nullable|string',
            'cover_image_url'  => 'nullable|url',
            'is_active'        => 'boolean',
        ]);

        $code = $this->normalizeLang($validated['lang']);

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

            $this->upsertQuizTr($code, $quizId, 'title',            (string)$validated['title']);
            $this->upsertQuizTr($code, $quizId, 'quiz_description', (string)($validated['quiz_description'] ?? ''));
            $this->upsertActiveQuiz($quizId, $code, (bool)($validated['is_active'] ?? false));

            $order = 0;
            foreach ($questions as $q) {
                $correct = $q['correctIndices'] ?? [];
                $idType  = isset($q['id_type']) ? (int)$q['id_type'] : ((count($correct)>1)?2:1);

                $qid = (int) DB::table('questions')->insertGetId([
                    'id_quiz'=>$quizId,'id_type'=>$idType,'order'=>$order++,
                    'created_at'=>now(),'updated_at'=>now(),
                ]);

                $opts = $q['options'] ?? [];
                foreach (array_values($opts) as $idx => $text) {
                    $aid = (int) DB::table('answers')->insertGetId([
                        'id_question'=>$qid,
                        'is_correct'=> in_array($idx, $correct, true) ? 1 : 0,
                        'created_at'=>now(),'updated_at'=>now(),
                    ]);
                    $this->upsertAnswerTr($code, $aid, (string)($text ?? ''));
                }

                $this->upsertQuestionTr($code, $qid, 'question_title',       (string)($q['title'] ?? ''));
                $this->upsertQuestionTr($code, $qid, 'question_description', (string)($q['description'] ?? ''));
            }

            // Mono-lang modules/tags if provided
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

    public function update(Request $request, $id)
    {
        $languagesRaw = $request->input('languages');
        $languages = is_string($languagesRaw) ? (json_decode($languagesRaw, true) ?? []) : $languagesRaw;

        // MULTI
        if (is_array($languages) && !empty($languages)) {
            $quiz = DB::table('quiz')->where('id_quiz',$id)->first();
            if (!$quiz) return response()->json(['message'=>'Quiz not found'], 404);

            DB::beginTransaction();
            try {
                // Cover
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

                // Existing
                $existingQ = DB::table('questions')->where('id_quiz',$id)
                    ->orderBy('order')->orderBy('id_question')->get()->keyBy('id_question');

                // Reference
                $ref = collect($languages)->first(fn($L)=>!empty($L['questions'])) ?? ($languages[0] ?? []);
                $qMap = []; $aMap = []; $keptQ = []; $keptAByQ = []; $order = 0;

                foreach (($ref['questions'] ?? []) as $idxQ => $q) {
                    $correct = $q['correctIndices'] ?? [];
                    $idType  = isset($q['id_type']) ? (int)$q['id_type'] : ((count($correct)>1)?2:1);

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
                    $qMap[$idxQ] = $qid; $keptQ[] = $qid;

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
                            $existingRow = $existingA[$idxA] ?? null;
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

                // TR + activation
                foreach ($languages as $L) {
                    $code = $this->normalizeLang($L['code'] ?? 'en');

                    $this->upsertQuizTr($code, (int)$id, 'title',            (string)($L['title'] ?? ''));
                    $this->upsertQuizTr($code, (int)$id, 'quiz_description', (string)($L['quiz_description'] ?? ''));
                    $this->upsertActiveQuiz((int)$id, $code, (bool)($L['is_active'] ?? false));

                    foreach (($L['questions'] ?? []) as $idxQ => $q) {
                        if (!array_key_exists($idxQ, $qMap)) continue;
                        $qid = $qMap[$idxQ];

                        $this->upsertQuestionTr($code, $qid, 'question_title',       (string)($q['title'] ?? ''));
                        $this->upsertQuestionTr($code, $qid, 'question_description', (string)($q['description'] ?? ''));

                        foreach (array_values($q['options'] ?? []) as $idxA => $text) {
                            if (!isset($aMap[$idxQ][$idxA])) continue;
                            $aid = $aMap[$idxQ][$idxA];
                            $this->upsertAnswerTr($code, $aid, (string)($text ?? ''));
                        }
                    }
                }

                $this->cleanupRemovedQA((int)$id, $keptQ, $keptAByQ);

                $allModuleIds = $this->collectModuleIdsFromLanguages($languages);
                [$allTagIds, $allNewTags] = $this->collectTagsFromLanguages($languages);
                $this->syncQuizModules((int)$id, $allModuleIds);
                $this->syncQuizTags((int)$id, $allTagIds ?? [], $allNewTags ?? []);

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

        // MONO
        $validated = $request->validate([
            'lang'             => 'required|string|size:2',
            'title'            => 'required|string|max:255',
            'quiz_description' => 'nullable|string',
            'cover_image_url'  => 'nullable|url',
            'is_active'        => 'boolean',
        ]);

        $code = $this->normalizeLang($validated['lang']);

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
            $existingQ = DB::table('questions')->where('id_quiz',$id)->orderBy('order')->get()->keyBy('id_question');
            $qKept = []; $aKeptByQ = []; $order = 0;

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
                    $this->upsertAnswerTr($code, $aid, (string)($text ?? ''));
                    $aKeptByQ[$qid][] = $aid;
                }

                $this->upsertQuestionTr($code, $qid, 'question_title',       (string)($q['title'] ?? ''));
                $this->upsertQuestionTr($code, $qid, 'question_description', (string)($q['description'] ?? ''));
            }

            $this->cleanupRemovedQA((int)$id, $qKept, $aKeptByQ);

            $m = $request->input('module_ids', null);
            $t = $request->input('tag_ids', null);
            $n = $request->input('new_tags', null);
            $this->syncQuizModules((int)$id, is_array($m) ? $m : null);
            $this->syncQuizTags((int)$id, is_array($t) ? $t : [], is_array($n) ? $n : []);

            $this->upsertQuizTr($code, (int)$id, 'title',            (string)$validated['title']);
            $this->upsertQuizTr($code, (int)$id, 'quiz_description', (string)($validated['quiz_description'] ?? ''));
            $this->upsertActiveQuiz((int)$id, $code, (bool)($validated['is_active'] ?? false));

            DB::commit();
            return response()->json(['id'=>(int)$id], 200);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message'=>'Error while updating the quiz','error'=>$e->getMessage()], 500);
        }
    }

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

            DB::table('active_quiz')->where('id_quiz', $quiz->id)->delete();
            DB::table('translations')->where('quiz_id', $quiz->id)->delete();
            DB::table('translations')
                ->whereIn('question_id', DB::table('questions')->where('id_quiz',$quiz->id)->pluck('id_question'))
                ->delete();

            $quiz->delete();
        });

        return response()->noContent();
    }

    public function editor(Request $request, $id)
    {
        $lang = $this->normalizeLang($request->input('lang', app()->getLocale()));

        $quiz = DB::table('quiz')->where('id_quiz',$id)->first();
        if (!$quiz) return response()->json(['message'=>'Quiz not found'], 404);

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

        $title = DB::table('translations')->where([
            ['quiz_id','=',$id],['lang','=',$lang],
            ['element_type','=','quiz'],['field_name','=','title'],
        ])->value('element_text') ?? '';

        $desc = DB::table('translations')->where([
            ['quiz_id','=',$id],['lang','=',$lang],
            ['element_type','=','quiz'],['field_name','=','quiz_description'],
        ])->value('element_text') ?? '';

        $isActive = (int) DB::table('active_quiz')
            ->where('id_quiz',$id)->where('lang',$lang)
            ->value('is_active') ?? 0;

        $qs = [];
        foreach ($questions as $q) {
            $qid = (int)$q->id_question;

            $qTitle = DB::table('translations')->where([
                ['question_id','=',$qid],['lang','=',$lang],
                ['element_type','=','question'],['field_name','=','question_title'],
            ])->value('element_text') ?? '';

            $qDesc = DB::table('translations')->where([
                ['question_id','=',$qid],['lang','=',$lang],
                ['element_type','=','question'],['field_name','=','question_description'],
            ])->value('element_text') ?? '';

            $as = [];
            foreach ($answersByQ[$qid] as $a) {
                $aid = (int)$a->id_answer;
                $aText = DB::table('translations')->where([
                    ['answer_id','=',$aid],['lang','=',$lang],
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
            'translations' => [[
                'lang'             => $lang,
                'id'               => (int)$id,
                'title'            => $title,
                'quiz_description' => $desc,
                'cover_image_url'  => $quiz->cover_image_url ?? '',
                'is_active'        => (bool)$isActive,
                'questions'        => $qs,
            ]],
            'modules'      => $modules,
            'tags'         => $tags,
        ]);
    }
}
