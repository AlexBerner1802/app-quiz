<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

use App\Models\Quiz;
use App\Models\Question;
use App\Models\Answer;
use App\Models\Module;
use App\Models\Tag;
use App\Models\ActiveQuiz;
use Illuminate\Support\Facades\Schema;

class QuizController extends Controller
{
    private function coerceFrontInputs(Request $request): void
    {
        $decode = function ($val) {
            if (is_string($val)) {
                $trim = trim($val);
                if (($trim !== '' && $trim[0] === '{' && str_ends_with($trim, '}'))
                || ($trim !== '' && $trim[0] === '[' && str_ends_with($trim, ']'))) {
                    $tmp = json_decode($trim, true);
                    if (json_last_error() === JSON_ERROR_NONE) return $tmp;
                }
            }
            return $val;
        };

        foreach ([
            'translations',
            'is_active_by_lang',
            'questions',
            'questions_translations',
            'module_ids',
            'tag_ids',
            'new_tags',
        ] as $k) {
            if ($request->has($k)) {
                $request->merge([$k => $decode($request->input($k))]);
            }
        }

        // booleans "true"/"false" → bool
        if ($request->has('is_active')) {
            $v = $request->input('is_active');
            if (is_string($v)) {
                $vv = strtolower($v);
                if ($vv === 'true' || $vv === '1')  { $request->merge(['is_active' => true]); }
                if ($vv === 'false' || $vv === '0') { $request->merge(['is_active' => false]); }
            }
        }

        // map booleans for is_active_by_lang
        if ($request->has('is_active_by_lang') && is_array($request->input('is_active_by_lang'))) {
            $map = $request->input('is_active_by_lang');
            foreach ($map as $k => $v) {
                if (is_string($v)) {
                    $vv = strtolower($v);
                    if ($vv === 'true' || $vv === '1')  $map[$k] = true;
                    if ($vv === 'false' || $vv === '0') $map[$k] = false;
                }
            }
            $request->merge(['is_active_by_lang' => $map]);
        }

        $normalizeIds = function ($v) {
            if (is_string($v)) {
                $v = array_filter(array_map('trim', explode(',', $v)), fn($x) => $x !== '');
            }
            if (!is_array($v)) return [];
            return array_map(fn($x) => is_numeric($x) ? (int)$x : $x, $v);
        };
        foreach (['module_ids','tag_ids'] as $k) {
            if ($request->has($k)) $request->merge([$k => $normalizeIds($request->input($k))]);
        }

        if ($request->has('new_tags')) {
            $v = $request->input('new_tags');
            if (is_string($v)) {
                $v = array_filter(array_map('trim', explode(',', $v)), fn($x) => $x !== '');
            }
            if (!is_array($v)) $v = [];
            $request->merge(['new_tags' => $v]);
        }
    }

    private const ALLOWED_LANGS = ['fr','en','de','it'];

    private function quizPk(): string { return 'id_quiz'; }

    // GET /api/quizzes
    public function index(Request $request)
    {
        $lang = strtolower($request->input('lang', 'en'));
        if (!in_array($lang, self::ALLOWED_LANGS, true)) $lang = 'en';

        $quizzes = Quiz::query()
            ->with(['tags:id,tag_name', 'modules:id,module_name'])
            ->get();

        if ($quizzes->isEmpty()) {
            return response()->json([]);
        }

        $quizIds = $quizzes->pluck($this->quizPk())->all();

        $tRows = DB::table('translations')
            ->where('element_type', 'quiz')
            ->where('lang', $lang)
            ->whereIn('quiz_id', $quizIds)
            ->whereIn('field_name', ['title','quiz_description','cover_image_url'])
            ->get()
            ->groupBy('quiz_id');

        $actives = DB::table('active_quiz')
            ->whereIn('id_quiz', $quizIds)
            ->where('lang', $lang)
            ->pluck('is_active','id_quiz');

        $mapped = $quizzes->map(function ($quiz) use ($tRows, $actives) {
            $qid = $quiz->{$this->quizPk()};
            $tmap = collect($tRows->get($qid, []))->keyBy('field_name');

            $quiz->title            = optional($tmap->get('title'))->element_text;
            $quiz->quiz_description = optional($tmap->get('quiz_description'))->element_text;
            $quiz->cover_image_url  = optional($tmap->get('cover_image_url'))->element_text ?? $quiz->cover_image_url;

            $quiz->is_active = (bool)($actives[$qid] ?? 0);
            return $quiz;
        });

        if ($request->boolean('only_active')) {
            $mapped = $mapped->filter(fn($q) => $q->is_active);
        }

        return response()->json($mapped->values());
    }

    // GET /api/quizzes/{id}
    public function show(Request $request, $id)
    {
        $lang = strtolower($request->input('lang', 'en'));
        if (!in_array($lang, self::ALLOWED_LANGS, true)) $lang = 'en';

        $quiz = Quiz::with(['tags:id,tag_name', 'modules:id,module_name'])
            ->find($id);

        if (!$quiz) {
            return response()->json(['message' => "Quiz not found for ID $id"], 404);
        }

        $qid = $quiz->{$this->quizPk()};

        // Active in this language ?
        $isActive = ActiveQuiz::where('id_quiz', $qid)->where('lang', $lang)->where('is_active', 1)->exists();
        if (!$isActive) {
            return response()->json(['message' => 'Quiz is inactive'], 403);
        }

        // i18n quiz
        $tQuiz = DB::table('translations')
            ->where('element_type','quiz')->where('lang',$lang)
            ->where('quiz_id',$qid)
            ->whereIn('field_name',['title','quiz_description','cover_image_url'])
            ->get()->keyBy('field_name');

        $quiz->title            = optional($tQuiz->get('title'))->element_text;
        $quiz->quiz_description = optional($tQuiz->get('quiz_description'))->element_text;
        $quiz->cover_image_url  = optional($tQuiz->get('cover_image_url'))->element_text ?? $quiz->cover_image_url;

        // Questions
        $questions = Question::where('id_quiz', $qid)->orderBy('order')->get();
        $qIds = $questions->pluck('id_question')->all();

        // Answers grouped by question
        $answers = Answer::whereIn('id_question', $qIds ?: [-1])->get()->groupBy('id_question');

        // i18n questions
        $tQ = DB::table('translations')
            ->where('element_type','question')->where('lang',$lang)
            ->whereIn('question_id',$qIds ?: [-1])
            ->whereIn('field_name',['question_title','question_description'])
            ->get()->groupBy('question_id');

        // i18n answers
        $aIds = $answers->flatten()->pluck('id_answer')->all();
        $tA = DB::table('translations')
            ->where('element_type','answer')->where('lang',$lang)
            ->whereIn('answer_id',$aIds ?: [-1])
            ->where('field_name','answer_text')
            ->get()->groupBy('answer_id');

        $quiz->questions = $questions->map(function($q) use ($answers, $tQ, $tA) {
            $qt = collect($tQ->get($q->id_question, []))->keyBy('field_name');

            $q->question_title       = optional($qt->get('question_title'))->element_text;
            $q->question_description = optional($qt->get('question_description'))->element_text;

            $q->answers = ($answers->get($q->id_question, collect()))->map(function($a) use ($tA) {
                $txt = optional(collect($tA->get($a->id_answer, []))->first())->element_text;
                return [
                    'id_answer'   => $a->id_answer,
                    'answer_text' => $txt,
                    'is_correct'  => (bool)$a->is_correct,
                ];
            })->values();

            return $q;
        })->values();

        return response()->json($quiz);
    }

    // POST /api/quizzes
    public function store(Request $request)
    {
        $this->coerceFrontInputs($request);

        $validated = $request->validate([
            // i18n quiz
            'title'                               => 'nullable|string',
            'quiz_description'                    => 'nullable|string',
            'cover_image_url'                     => 'nullable|url',
            'cover_image'                         => 'nullable|image|max:4096',
            'translations'                        => 'array',
            'translations.*.title'                => 'nullable|string',
            'translations.*.quiz_description'     => 'nullable|string',
            'translations.*.cover_image_url'      => 'nullable|url',

            // Activity
            'is_active'                           => 'required|boolean',
            'is_active_by_lang'                   => 'array',
            'is_active_by_lang.*'                 => 'boolean',

            // Questions structure + i18n Q/A
            'questions'                           => 'nullable',
            'questions_translations'              => 'array',
            'questions_translations.*'            => 'array',

            // modules/tags
            'module_ids'                          => 'array',
            'module_ids.*'                        => 'integer|exists:modules,id',
            'tag_ids'                             => 'array',
            'tag_ids.*'                           => 'integer|exists:tags,id',
            'new_tags'                            => 'array',
            'new_tags.*'                          => 'string|min:1|max:50',
        ]);

        // Cover
        $coverUrl = null;
        if ($request->hasFile('cover_image')) {
            $path = $request->file('cover_image')->store('quiz-cards', 'public');
            $coverUrl = url(Storage::url($path));
        } elseif (!empty($validated['cover_image_url'])) {
            $coverUrl = $validated['cover_image_url'];
        }

        // i18n quiz
        $i18nQuiz = $this->normalizeQuizI18n($request, $coverUrl);

        // Activity by lang
        $isActiveByLang = $this->resolveActiveByLang($request, array_keys($i18nQuiz));

        // Q/A structure
        $questions = $this->parseQuestionsStructure($request->input('questions'));
        $qaI18nByLang = $this->normalizeQuestionsTranslations($request, $questions);

        DB::beginTransaction();
        try {
            // Create quiz
            $firstLang = array_key_first($i18nQuiz);
            $quiz = Quiz::create([
                'cover_image_url' => $i18nQuiz[$firstLang]['cover_image_url'] ?? $coverUrl,
            ]);

            // i18n quiz + activity
            $this->upsertQuizTranslations($quiz, $i18nQuiz);
            $this->upsertActiveByLang($quiz, $isActiveByLang);

            // Q/A
            [$qIdsByIdx, $aIdsByQIdx] = $this->createQuestionsAndAnswers($quiz, $questions);

            // i18n Q/A
            if (!empty($qaI18nByLang)) {
                $this->upsertQA_Translations($qIdsByIdx, $aIdsByQIdx, $qaI18nByLang);
            }

            // Modules
            if (!empty($validated['module_ids'])) {
                $quiz->modules()->sync($validated['module_ids']);
            }

            // Existing tags + new ones
            $tagIds = $validated['tag_ids'] ?? [];
            $createdTagIds = [];
            if (!empty($validated['new_tags'])) {
                foreach ($validated['new_tags'] as $name) {
                    $name = trim($name);
                    if ($name === '') continue;
                    $tag = Tag::firstOrCreate(['tag_name' => $name]);
                    $createdTagIds[] = $tag->id;
                }
            }
            if (!empty($tagIds) || !empty($createdTagIds)) {
                $quiz->tags()->sync(array_merge($tagIds, $createdTagIds));
            }

            DB::commit();

            $fresh = Quiz::select($this->quizPk(), 'cover_image_url', 'created_at', 'updated_at')
                ->with(['modules:id,module_name','tags:id,tag_name'])
                ->find($quiz->{$this->quizPk()});

            return response()->json($fresh, 201);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error while creating the quiz',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    // PUT/PATCH /api/quizzes/{id}
    public function update(Request $request, $id)
    {
        $this->coerceFrontInputs($request);

        $quiz = Quiz::findOrFail($id);

        $validated = $request->validate([
            'title'                               => 'nullable|string|max:30',
            'quiz_description'                    => 'nullable|string|max:255',
            'cover_image_url'                     => 'nullable|url',
            'cover_image'                         => 'nullable|image|max:4096',
            'translations'                        => 'array',
            'translations.*.title'                => 'nullable|string',
            'translations.*.quiz_description'     => 'nullable|string',
            'translations.*.cover_image_url'      => 'nullable|url',

            'is_active'                           => 'required|boolean',
            'is_active_by_lang'                   => 'array',
            'is_active_by_lang.*'                 => 'boolean',

            'questions'                           => 'nullable',
            'questions_translations'              => 'array',
            'questions_translations.*'            => 'array',

            'module_ids'       => 'array',
            'module_ids.*'     => 'integer|exists:modules,id',
            'tag_ids'          => 'array',
            'tag_ids.*'        => 'integer|exists:tags,id',
            'new_tags'         => 'array',
            'new_tags.*'       => 'string|min:1|max:50',
        ]);

        // Cover
        if ($request->hasFile('cover_image')) {
            $path = $request->file('cover_image')->store('quiz-cards', 'public');
            $quiz->cover_image_url = url(Storage::url($path));
        } elseif (!empty($validated['cover_image_url'])) {
            $quiz->cover_image_url = $validated['cover_image_url'];
        }

        // i18n quiz
        $i18nQuiz = $this->normalizeQuizI18n($request, $quiz->cover_image_url ?? null);

        // Activity by lang
        $isActiveByLang = $this->resolveActiveByLang($request, empty($i18nQuiz) ? self::ALLOWED_LANGS : array_keys($i18nQuiz));

        // Questions structures + i18n Q/A
        $questions     = $this->parseQuestionsStructure($request->input('questions'));
        $qaI18nByLang  = $this->normalizeQuestionsTranslations($request, $questions);

        DB::beginTransaction();
        try {
            $quiz->save();

            if ($request->has('module_ids')) {
                $quiz->modules()->sync($validated['module_ids'] ?? []);
            }

            $tagIds = $validated['tag_ids'] ?? [];
            $createdTagIds = [];
            if (!empty($validated['new_tags'])) {
                foreach ($validated['new_tags'] as $name) {
                    $name = trim($name);
                    if ($name === '') continue;
                    $tag = Tag::firstOrCreate(['tag_name' => $name]);
                    $createdTagIds[] = $tag->id;
                }
            }
            if ($request->has('tag_ids') || $request->has('new_tags')) {
                $quiz->tags()->sync(array_merge($tagIds, $createdTagIds));
            }

            // Rebuild Q/A if 'questions' is given
            $qIdsByIdx = [];
            $aIdsByQIdx = [];
            if ($request->has('questions')) {
                $this->deleteQuizQuestions($quiz);
                [$qIdsByIdx, $aIdsByQIdx] = $this->createQuestionsAndAnswers($quiz, $questions);
            }

            // i18n quiz
            if (!empty($i18nQuiz)) {
                $this->upsertQuizTranslations($quiz, $i18nQuiz);
            }

            // Activity by lang
            if (!empty($isActiveByLang)) {
                $this->upsertActiveByLang($quiz, $isActiveByLang);
            }

            // i18n Q/A
            if (!empty($qaI18nByLang)) {
                if (empty($qIdsByIdx)) {
                    [$qIdsByIdx, $aIdsByQIdx] = $this->loadExistingQAMap($quiz);
                }
                $this->upsertQA_Translations($qIdsByIdx, $aIdsByQIdx, $qaI18nByLang);
            }

            DB::commit();

            $fresh = Quiz::select($this->quizPk(), 'cover_image_url', 'created_at', 'updated_at')
                ->with(['modules:id,module_name','tags:id,tag_name'])
                ->find($quiz->{$this->quizPk()});

            return response()->json($fresh, 200);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error while updating the quiz',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    // DELETE /api/quizzes/{id}
    public function destroy($id)
    {
        $quiz = Quiz::findOrFail($id);

        DB::transaction(function () use ($quiz) {
            $quiz->modules()->detach();
            $quiz->tags()->detach();

            $this->deleteQuizQuestions($quiz);

            DB::table('translations')->where('element_type','quiz')->where('quiz_id',$quiz->{$this->quizPk()})->delete();
            DB::table('active_quiz')->where('id_quiz',$quiz->{$this->quizPk()})->delete();

            $quiz->delete();
        });

        return response()->noContent();
    }

     // Helpers – i18n / activity
    private function normalizeQuizI18n(Request $request, ?string $coverUrl): array
    {
        $translations = $request->input('translations', []);
        $norm = [];

        if (is_array($translations) && !empty($translations)) {
            foreach ($translations as $lang => $fields) {
                $lang = strtolower(trim((string)$lang));
                if (!in_array($lang, self::ALLOWED_LANGS, true)) continue;
                $norm[$lang] = [
                    'title'            => $fields['title'] ?? null,
                    'quiz_description' => $fields['quiz_description'] ?? null,
                    'cover_image_url'  => $fields['cover_image_url'] ?? $coverUrl,
                ];
            }
        } else {
            $singleLang = strtolower($request->input('lang', 'en'));
            if (!in_array($singleLang, self::ALLOWED_LANGS, true)) $singleLang = 'en';
            $norm[$singleLang] = [
                'title'            => $request->input('title'),
                'quiz_description' => $request->input('quiz_description'),
                'cover_image_url'  => $coverUrl ?? $request->input('cover_image_url'),
            ];
        }

        return array_filter($norm, fn($f) =>
            $f['title'] !== null || $f['quiz_description'] !== null || $f['cover_image_url'] !== null
        );
    }

    private function resolveActiveByLang(Request $request, array $langs): array
    {
        $byLang = $request->input('is_active_by_lang', []);
        $global = (bool) $request->input('is_active', false);

        $out = [];
        foreach ($langs as $lang) {
            $out[$lang] = isset($byLang[$lang]) ? (bool)$byLang[$lang] : $global;
        }
        return $out;
    }

    private function parseQuestionsStructure($raw): array
    {
        if (is_string($raw)) $raw = json_decode($raw, true) ?? [];
        if (!is_array($raw)) $raw = [];

        return array_values(array_map(function($q, $idx){
            return [
                'id_type' => isset($q['id_type']) ? (int)$q['id_type'] : ((count($q['correctIndices'] ?? []) > 1) ? 2 : 1),
                'order'   => isset($q['order']) ? (int)$q['order'] : ($idx+1),
                'options' => array_values($q['options'] ?? []),
                'correct' => array_values($q['correctIndices'] ?? []),
                'title'   => $q['question_titre'] ?? $q['title'] ?? null,
                'desc'    => $q['question_description'] ?? $q['description'] ?? null,
            ];
        }, $raw, array_keys($raw)));
    }

    private function normalizeQuestionsTranslations(Request $request, array $questions): array
    {
        $byLang = $request->input('questions_translations', []);
        $out = [];

        if (is_array($byLang) && !empty($byLang)) {
            foreach ($byLang as $lang => $arr) {
                $lang = strtolower(trim((string)$lang));
                if (!in_array($lang, self::ALLOWED_LANGS, true)) continue;
                if (!is_array($arr)) continue;

                $out[$lang] = [];
                foreach ($questions as $i => $q) {
                    $qL = $arr[$i] ?? [];
                    $out[$lang][$i] = [
                        'question_title'       => $qL['question_title'] ?? null,
                        'question_description' => $qL['question_description'] ?? null,
                        'answers'              => is_array($qL['answers'] ?? null) ? array_values($qL['answers']) : [],
                    ];
                }
            }
        } else {
            $lang = strtolower($request->input('lang', 'en'));
            if (!in_array($lang, self::ALLOWED_LANGS, true)) $lang = 'en';

            $out[$lang] = [];
            foreach ($questions as $i => $q) {
                $out[$lang][$i] = [
                    'question_title'       => $q['title'] ?? null,
                    'question_description' => $q['desc'] ?? null,
                    'answers'              => $q['options'] ?? [],
                ];
            }
        }

        return $out;
    }

    // Helpers DB OPS

    private function createQuestionsAndAnswers(Quiz $quiz, array $questions): array
    {
        $qIdsByIdx = [];
        $aIdsByQIdx = [];

        foreach ($questions as $i => $q) {
            $question = Question::create([
                'id_quiz' => $quiz->{$this->quizPk()},
                'id_type' => (int)$q['id_type'],
                'order'   => (int)$q['order'],
            ]);
            $qIdsByIdx[$i] = $question->id_question;

            $aIdsByQIdx[$i] = [];
            $opts = $q['options'] ?? [];
            $corr = $q['correct'] ?? [];
            foreach ($opts as $idx => $_) {
                $answer = Answer::create([
                    'id_question' => $question->id_question,
                    'is_correct'  => in_array($idx, $corr) ? 1 : 0,
                ]);
                $aIdsByQIdx[$i][$idx] = $answer->id_answer;
            }
        }

        return [$qIdsByIdx, $aIdsByQIdx];
    }

    private function deleteQuizQuestions(Quiz $quiz): void
    {
        $qIds = Question::where('id_quiz', $quiz->{$this->quizPk()})->pluck('id_question')->all();
        $aIds = Answer::whereIn('id_question', $qIds ?: [-1])->pluck('id_answer')->all();

        DB::table('translations')->whereIn('answer_id', $aIds ?: [-1])->delete();
        DB::table('translations')->whereIn('question_id', $qIds ?: [-1])->delete();

        Answer::whereIn('id_question', $qIds ?: [-1])->delete();
        Question::where('id_quiz', $quiz->{$this->quizPk()})->delete();
    }

    private function loadExistingQAMap(Quiz $quiz): array
    {
        $questions = Question::where('id_quiz', $quiz->{$this->quizPk()})->orderBy('order')->get();
        $qIdsByIdx = [];
        $aIdsByQIdx = [];

        foreach ($questions as $i => $q) {
            $qIdsByIdx[$i] = $q->id_question;
            $answers = Answer::where('id_question', $q->id_question)->orderBy('id_answer')->get();
            $aIdsByQIdx[$i] = [];
            foreach ($answers as $j => $a) {
                $aIdsByQIdx[$i][$j] = $a->id_answer;
            }
        }
        return [$qIdsByIdx, $aIdsByQIdx];
    }

    private function upsertQuizTranslations(Quiz $quiz, array $i18n): void
    {
        $rows = [];
        $now  = now();
        $qid  = $quiz->{$this->quizPk()};

        foreach ($i18n as $lang => $fields) {
            foreach (['title','quiz_description','cover_image_url'] as $field) {
                if (!array_key_exists($field, $fields)) continue;
                $val = $fields[$field];
                if ($val === null) continue;

                $rows[] = [
                    'element_type' => 'quiz',
                    'quiz_id'      => $qid,
                    'question_id'  => null,
                    'answer_id'    => null,
                    'lang'         => $lang,
                    'field_name'   => $field,
                    'element_text' => $val,
                    'created_at'   => $now,
                    'updated_at'   => $now,
                ];
            }
        }

        if (!empty($rows)) {
            DB::table('translations')->upsert(
                $rows,
                ['lang','field_name','quiz_id'],
                ['element_text','updated_at']
            );
        }
    }

    private function upsertActiveByLang(Quiz $quiz, array $isActiveByLang): void
    {
        $rows = [];
        $now = now();
        $qid = $quiz->{$this->quizPk()};
        foreach ($isActiveByLang as $lang => $state) {
            if (!in_array($lang, self::ALLOWED_LANGS, true)) continue;
            $rows[] = [
                'id_quiz'    => $qid,
                'lang'       => $lang,
                'is_active'  => $state ? 1 : 0,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
        if (!empty($rows)) {
            DB::table('active_quiz')->upsert(
                $rows,
                ['id_quiz','lang'],
                ['is_active','updated_at']
            );
        }
    }

    private function upsertQA_Translations(array $qIdsByIdx, array $aIdsByQIdx, array $qaI18nByLang): void
    {
        $rows = [];
        $now  = now();

        foreach ($qaI18nByLang as $lang => $arr) {
            foreach ($arr as $qi => $payload) {
                $questionId = $qIdsByIdx[$qi] ?? null;
                if ($questionId) {
                    if (!empty($payload['question_title'])) {
                        $rows[] = [
                            'element_type' => 'question',
                            'quiz_id'      => null,
                            'question_id'  => $questionId,
                            'answer_id'    => null,
                            'lang'         => $lang,
                            'field_name'   => 'question_title',
                            'element_text' => $payload['question_title'],
                            'created_at'   => $now,
                            'updated_at'   => $now,
                        ];
                    }
                    if (array_key_exists('question_description',$payload) && $payload['question_description'] !== null) {
                        $rows[] = [
                            'element_type' => 'question',
                            'quiz_id'      => null,
                            'question_id'  => $questionId,
                            'answer_id'    => null,
                            'lang'         => $lang,
                            'field_name'   => 'question_description',
                            'element_text' => $payload['question_description'],
                            'created_at'   => $now,
                            'updated_at'   => $now,
                        ];
                    }
                }

                $answers = $payload['answers'] ?? [];
                foreach ($answers as $aj => $text) {
                    if ($text === null) continue;
                    $answerId = $aIdsByQIdx[$qi][$aj] ?? null;
                    if (!$answerId) continue;

                    $rows[] = [
                        'element_type' => 'answer',
                        'quiz_id'      => null,
                        'question_id'  => null,
                        'answer_id'    => $answerId,
                        'lang'         => $lang,
                        'field_name'   => 'answer_text',
                        'element_text' => $text,
                        'created_at'   => $now,
                        'updated_at'   => $now,
                    ];
                }
            }
        }

        if (!empty($rows)) {
            foreach (array_chunk($rows, 500) as $slice) {
                DB::table('translations')->upsert(
                    $slice,
                    ['lang','field_name','quiz_id','question_id','answer_id'],
                    ['element_text','updated_at']
                );
            }
        }
    }

    public function editor(Request $request, $id)
    {
        $allowed = ['fr','en','de','it'];
        $lang = strtolower($request->query('lang', 'en'));
        if (!in_array($lang, $allowed, true)) $lang = 'en';

        $quiz = Quiz::with(['modules:id,module_name', 'tags:id,tag_name'])->find($id);
        if (!$quiz) {
            return response()->json(['message' => "Quiz not found for ID $id"], 404);
        }

        $qid = $quiz->{$this->quizPk()};

        $langsPresent = DB::table('translations')
            ->where('element_type','quiz')
            ->where('quiz_id', $qid)
            ->distinct()
            ->pluck('lang')
            ->filter(fn($l) => in_array($l, $allowed, true))
            ->values()
            ->all();

        if (empty($langsPresent)) {
            return response()->json([
                'id_quiz' => $qid,
                'modules' => $quiz->modules,
                'tags'    => $quiz->tags,
                'translations' => [],
            ]);
        }

        $actives = DB::table('active_quiz')
            ->where('id_quiz', $qid)
            ->whereIn('lang', $langsPresent)
            ->pluck('is_active', 'lang');

        $questions = Question::where('id_quiz', $qid)->orderBy('order')->get();
        $qIds = $questions->pluck('id_question')->all();
        $answersByQ = Answer::whereIn('id_question', $qIds ?: [-1])->get()->groupBy('id_question');

        $translations = [];
        foreach ($langsPresent as $lg) {
            $tQuiz = DB::table('translations')
                ->where('element_type','quiz')->where('lang',$lg)
                ->where('quiz_id',$qid)
                ->whereIn('field_name',['title','quiz_description','cover_image_url'])
                ->get()->keyBy('field_name');

            $tQ = DB::table('translations')
                ->where('element_type','question')->where('lang',$lg)
                ->whereIn('question_id',$qIds ?: [-1])
                ->whereIn('field_name',['question_title','question_description'])
                ->get()->groupBy('question_id');

            $aIds = $answersByQ->flatten()->pluck('id_answer')->all();
            $tA = DB::table('translations')
                ->where('element_type','answer')->where('lang',$lg)
                ->whereIn('answer_id',$aIds ?: [-1])
                ->where('field_name','answer_text')
                ->get()->groupBy('answer_id');

            $translations[] = [
                'lang' => $lg,
                'title' => optional($tQuiz->get('title'))->element_text ?? '',
                'quiz_description' => optional($tQuiz->get('quiz_description'))->element_text ?? '',
                'cover_image_url' => optional($tQuiz->get('cover_image_url'))->element_text ?? ($quiz->cover_image_url ?? ''),
                'is_active' => (bool) ($actives[$lg] ?? 0),

                'questions' => $questions->map(function($q) use ($answersByQ, $tQ, $tA) {
                    $qt = collect($tQ->get($q->id_question, []))->keyBy('field_name');
                    $answers = ($answersByQ->get($q->id_question, collect()))->map(function($a) use ($tA) {
                        $txt = optional(collect($tA->get($a->id_answer, []))->first())->element_text ?? '';
                        return [
                            'id'          => $a->id_answer,
                            'id_answer'   => $a->id_answer,
                            'answer_text' => $txt,
                            'is_correct'  => (bool)$a->is_correct,
                        ];
                    })->values();

                    return [
                        'id' => $q->id_question,
                        'id_question' => $q->id_question,
                        'question_titre' => optional($qt->get('question_title'))->element_text ?? '',
                        'question_description' => optional($qt->get('question_description'))->element_text ?? '',
                        'answers' => $answers,
                    ];
                })->values(),
            ];
        }

        return response()->json([
            'id_quiz' => $qid,
            'modules' => $quiz->modules,
            'tags'    => $quiz->tags,
            'translations' => $translations,
        ]);
    }

}
