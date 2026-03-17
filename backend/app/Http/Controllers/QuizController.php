<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

use App\Models\Quiz;
use App\Models\Question;
use App\Models\Answer;
use Throwable;

class QuizController extends Controller
{
    private const ROLE_APPRENTICE = 1;
    private const ROLE_TRAINER    = 2;
    private const ROLE_ADMIN      = 3;
    private const ROLE_SUPERADMIN = 4;

    private function quizPk(): string { return 'id_quiz'; }

    private function roleId($user): int
    {
        return (int) ($user->id_role ?? 0);
    }

    private function isTrainer($user): bool
    {
        return $this->roleId($user) >= self::ROLE_TRAINER;
    }

    private function isAdmin($user): bool
    {
        return $this->roleId($user) >= self::ROLE_ADMIN;
    }

    private function canCreateQuiz($user): bool
    {
        return $this->isTrainer($user);
    }

    private function canEditOrDeleteQuiz($user, $quiz): bool
    {
        if (!$user) return false;

        // Admin override: can manage everything
        if ($this->isAdmin($user)) return true;

        // Trainers can manage only their own quizzes
        if (!$this->isTrainer($user)) return false;

        $userId  = (int) ($user->id_user ?? 0);
        $ownerId = (int) ($quiz->id_owner ?? 0);

        return $userId !== 0 && $ownerId !== 0 && $userId === $ownerId;
    }

    private function ensureCanManageOr403(Request $request, Quiz $quiz): void
    {
        $u = $request->user();
        if (!$u) abort(401, 'Unauthenticated');

        if (!$this->canEditOrDeleteQuiz($u, $quiz)) {
            abort(403, 'Forbidden');
        }
    }

    /**
     * Helper: fetch quiz translations with fallback languages.
     * Returns rows grouped by [element_id][lang] collections.
     */
    private function loadQuizTranslationsWithFallback(array $quizIds, string $lang): array
    {
        $fallbackLangs = collect([$lang, 'en', 'fr'])->unique()->values()->all();

        $rows = DB::table('translations')
            ->where('element_type', 'quiz')
            ->whereIn('lang', $fallbackLangs)
            ->whereIn('element_id', $quizIds ?: [-1])
            ->whereIn('field_name', ['title', 'quiz_description', 'cover_image_url'])
            ->get()
            ->groupBy(['element_id', 'lang']);

        return [$rows, $fallbackLangs];
    }

    private function pickTranslatedField($groupedRows, array $fallbackLangs, int $qid, string $field, string $default = ''): string
    {
        foreach ($fallbackLangs as $L) {
            $rows = $groupedRows[$qid][$L] ?? collect();
            $hit = $rows->firstWhere('field_name', $field);
            if ($hit && isset($hit->element_text) && $hit->element_text !== '') {
                return (string) $hit->element_text;
            }
        }
        return $default;
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $lang = strtolower($request->query('lang', 'en'));
            $pivotLangs = [$lang, strtoupper($lang)];

            $authUser = $request->user();
            $authUserId = $authUser ? (int)($authUser->id_user ?? 0) : null;

            $quizzes = Quiz::with([
                'modules' => fn($q) => $q->wherePivotIn('lang', $pivotLangs),
                'tags'    => fn($q) => $q->wherePivotIn('lang', $pivotLangs),
                'activeQuizzes' => fn($q) => $q->where('lang', $lang),
            ])
                ->where(function ($q) use ($authUserId) {
                    // Public: active quizzes
                    $q->whereHas('activeQuizzes', fn($aq) => $aq->where('is_active', 1));

                    // Owner: see own even if inactive
                    if ($authUserId) {
                        $q->orWhere('id_owner', $authUserId);
                    }
                })
                ->get();

            if ($quizzes->isEmpty()) return response()->json([]);

            $quizIds = $quizzes->pluck('id_quiz')->all();
            [$tRows, $fallbackLangs] = $this->loadQuizTranslationsWithFallback($quizIds, $lang);

            $mapped = $quizzes->map(function ($quiz) use ($tRows, $fallbackLangs, $lang, $authUser) {
                $qid = (int) $quiz->id_quiz;

                $activeRecord = $quiz->activeQuizzes->first();
                $isActive = $activeRecord ? (bool) $activeRecord->is_active : false;

                $title = $this->pickTranslatedField($tRows, $fallbackLangs, $qid, 'title', '');
                $desc  = $this->pickTranslatedField($tRows, $fallbackLangs, $qid, 'quiz_description', '');
                $cover = $this->pickTranslatedField($tRows, $fallbackLangs, $qid, 'cover_image_url', $quiz->cover_image_url ?? '');

                $canManage = $authUser ? $this->canEditOrDeleteQuiz($authUser, $quiz) : false;

                return [
                    'id_quiz'           => $qid,
                    'lang'              => $lang,

                    'title'             => $title,
                    'description'       => $desc,
                    'cover_image_url'   => $cover ?: ($quiz->cover_image_url ?? ''),

                    'modules' => $quiz->modules->map(fn($m) => [
                        'id'   => $m->id_module,
                        'name' => $m->name,
                    ])->values(),

                    'tags' => $quiz->tags->map(fn($t) => [
                        'id'   => $t->id_tag,
                        'name' => $t->name,
                    ])->values(),

                    'is_active'         => $isActive,
                    'id_owner'          => $quiz->id_owner,

                    // IMPORTANT: admin override + trainer owner => true
                    'can_edit'          => (bool) $canManage,
                    'can_delete'        => (bool) $canManage,

                    'created_at'        => $quiz->created_at,
                    'updated_at'        => $quiz->updated_at,
                    'questions_to_show' => $quiz->questions_to_show,
                ];
            });

            return response()->json($mapped->values()->all());
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Error mapping quizzes',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    public function show(Request $request, $id): JsonResponse
    {
        try {
            $lang = strtolower($request->query('lang', 'en'));
            $pivotLangs = [$lang, strtoupper($lang)];

            $quiz = Quiz::with([
                'modules' => fn($q) => $q->wherePivotIn('lang', $pivotLangs),
                'tags'    => fn($q) => $q->wherePivotIn('lang', $pivotLangs),
            ])->find($id);

            if (!$quiz) return response()->json(['message' => "Quiz not found for ID $id"], 404);

            $qid = (int) $quiz->{$this->quizPk()};

            $isActive = (int) DB::table('active_quiz')
                ->where('id_quiz', $qid)
                ->where('lang', $lang)
                ->value('is_active');

            $authUser = $request->user();
            $authUserId = $authUser ? (int)($authUser->id_user ?? 0) : null;

            $isOwner = $authUserId && ((int)$quiz->id_owner === (int)$authUserId);

            // If inactive: only owner or admin can view
            if (!$isActive && !($authUser && $this->isAdmin($authUser)) && !$isOwner) {
                return response()->json(['message' => 'Quiz is inactive'], 403);
            }

            [$tRows, $fallbackLangs] = $this->loadQuizTranslationsWithFallback([$qid], $lang);

            $title      = $this->pickTranslatedField($tRows, $fallbackLangs, $qid, 'title', '');
            $desc       = $this->pickTranslatedField($tRows, $fallbackLangs, $qid, 'quiz_description', '');
            $coverImage = $this->pickTranslatedField($tRows, $fallbackLangs, $qid, 'cover_image_url', $quiz->cover_image_url ?? '');

            $questions = DB::table('questions')
                ->where('id_quiz', $qid)
                ->where('lang', $lang)
                ->orderBy('order')
                ->get();

            $qIds = $questions->isEmpty() ? [] : $questions->pluck('id_question')->all();

            $answers = DB::table('answers')
                ->whereIn('id_question', $qIds ?: [-1])
                ->get()
                ->groupBy('id_question');

            $answerIds = $answers->flatten()->pluck('id_answer')->all();

            $tQuestions = DB::table('translations')
                ->where('element_type', 'question')
                ->where('lang', $lang)
                ->whereIn('element_id', $qIds ?: [-1])
                ->whereIn('field_name', ['question_title', 'question_description'])
                ->get()
                ->groupBy('element_id');

            $tAnswers = DB::table('translations')
                ->where('element_type', 'answer')
                ->where('lang', $lang)
                ->whereIn('element_id', $answerIds ?: [-1])
                ->where('field_name', 'answer_text')
                ->get()
                ->groupBy('element_id');

            // IMPORTANT: don't leak correct answers to apprentices/participants
            $canSeeCorrect = $authUser
                ? ($this->isTrainer($authUser) || $this->isAdmin($authUser) || $isOwner)
                : false;

            $questionBlocks = collect($questions)->map(function ($q) use ($answers, $tQuestions, $tAnswers, $canSeeCorrect) {
                $qt = collect($tQuestions->get($q->id_question, []))->keyBy('field_name');

                $qTitle = optional($qt->get('question_title'))->element_text ?? '';
                $qDesc  = optional($qt->get('question_description'))->element_text ?? '';

                $ans = collect($answers->get($q->id_question, []))->map(function ($a) use ($tAnswers, $canSeeCorrect) {
                    $txt = optional(collect($tAnswers->get($a->id_answer, []))->first())->element_text ?? '';
                    $row = [
                        'id'   => $a->id_answer,
                        'text' => $txt,
                    ];
                    if ($canSeeCorrect) {
                        $row['is_correct'] = (bool) $a->is_correct;
                    }
                    return $row;
                })->values();

                return [
                    'id'          => $q->id_question,
                    'title'       => $qTitle,
                    'description' => $qDesc,
                    'answers'     => $ans,
                ];
            })->values();

            $owner = DB::table('users')
                ->join('roles', 'users.id_role', '=', 'roles.id_role')
                ->where('users.id_user', $quiz->id_owner)
                ->select([
                    'users.username',
                    'users.name',
                    'users.avatar',
                    'roles.name as role'
                ])
                ->first();

            $canManage = $authUser ? $this->canEditOrDeleteQuiz($authUser, $quiz) : false;

            return response()->json([
                $this->quizPk()     => $qid,
                'lang'              => $lang,
                'title'             => $title,
                'description'       => $desc,
                'cover_image_url'   => $coverImage ?: ($quiz->cover_image_url ?? ''),
                'is_active'         => (bool) $isActive,
                'created_at'        => $quiz->created_at,
                'updated_at'        => $quiz->updated_at,
                'questions_to_show' => $quiz->questions_to_show,

                'owner'             => $owner,
                'is_owner'          => (bool) $isOwner,

                // useful for UI on show page too
                'can_edit'          => (bool) $canManage,
                'can_delete'        => (bool) $canManage,

                'modules' => collect($quiz->modules)
                    ->map(fn($m) => ['id' => $m->id_module, 'name' => $m->name, 'slug' => $m->slug])
                    ->values(),

                'tags' => collect($quiz->tags)
                    ->map(fn($t) => ['id' => $t->id_tag, 'name' => $t->name, 'slug' => $t->slug])
                    ->values(),

                'questions' => $questionBlocks,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Error loading quiz',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthenticated'], 401);

        if (!$this->canCreateQuiz($user)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $quiz = $this->saveQuiz($request, null);
        return response()->json(['quiz' => $quiz], 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthenticated'], 401);

        $quiz = Quiz::find($id);
        if (!$quiz) {
            return response()->json([
                'error_code' => 'quiz_not_found',
                'message' => 'Quiz not found for ID '.$id
            ], 404);
        }

        // ✅ admin override / trainer owner
        $this->ensureCanManageOr403($request, $quiz);

        $quiz = $this->saveQuiz($request, $quiz);
        return response()->json(['quiz' => $quiz], 200);
    }

    public function destroy(Request $request, $id): Response
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthenticated'], 401);

        $quiz = Quiz::findOrFail($id);

        // ✅ admin override / trainer owner
        $this->ensureCanManageOr403($request, $quiz);

        DB::transaction(function () use ($quiz) {
            $quiz->modules()->detach();
            $quiz->tags()->detach();

            $this->deleteQuizQuestions($quiz);

            DB::table('translations')->where('element_type','quiz')->where('element_id',$quiz->{$this->quizPk()})->delete();
            DB::table('active_quiz')->where('id_quiz',$quiz->{$this->quizPk()})->delete();

            $quiz->delete();
        });

        return response()->noContent();
    }

    public function editor(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthenticated'], 401);

        $quiz = Quiz::with([
            'modules:id_module,name,slug',
            'tags:id_tag,name,slug'
        ])->find($id);

        if (!$quiz) return response()->json(['message' => "Quiz not found for ID $id"], 404);

        // ✅ admin override / trainer owner
        $this->ensureCanManageOr403($request, $quiz);

        $langsQuery = $request->query('langs', 'en');
        $allowed = array_filter(array_map('strtolower', explode(',', $langsQuery)));

        $qid = $quiz->{$this->quizPk()};

        $langsPresent = DB::table('translations')
            ->where('element_type', 'quiz')
            ->where('element_id', $qid)
            ->distinct()
            ->pluck('lang')
            ->filter(fn($l) => in_array(strtolower($l), $allowed, true))
            ->map(fn($l) => strtolower($l))
            ->unique()
            ->values()
            ->all();

        if (empty($langsPresent)) {
            return response()->json([
                'id_quiz' => $qid,
                'modules' => [],
                'tags' => [],
                'cover_image_url' => $quiz->cover_image_url ?? '',
                'questions_to_show' => $quiz->questions_to_show,
                'translations' => [],
            ]);
        }

        $actives = DB::table('active_quiz')
            ->where('id_quiz', $qid)
            ->whereIn('lang', $langsPresent)
            ->pluck('is_active', 'lang');

        $moduleIds = $quiz->modules->pluck('id_module')->all();
        $tagIds = $quiz->tags->pluck('id_tag')->all();

        $translations = [];

        foreach ($langsPresent as $lang) {
            $questions = DB::table('questions')
                ->where('id_quiz', $qid)
                ->where('lang', $lang)
                ->orderBy('order')
                ->get();

            $qIds = $questions->pluck('id_question')->all();

            $answersByQ = DB::table('answers')
                ->whereIn('id_question', $qIds ?: [-1])
                ->get()
                ->groupBy('id_question');

            $answerIds = $answersByQ->flatten()->pluck('id_answer')->all();

            $allElementIds = array_merge([$qid], $qIds, $answerIds, $moduleIds, $tagIds);

            $allTranslations = DB::table('translations')
                ->where('lang', $lang)
                ->whereIn('element_type', ['quiz','question','answer','module','tag'])
                ->whereIn('element_id', $allElementIds ?: [-1])
                ->get()
                ->groupBy(['element_type','element_id']);

            $tQuiz = $allTranslations['quiz'][$qid] ?? collect();
            $tQ = $allTranslations['question'] ?? collect();
            $tA = $allTranslations['answer'] ?? collect();

            $quizQuestions = collect($questions)->map(function($q) use ($answersByQ, $tQ, $tA) {
                $qtTranslations = collect($tQ->get($q->id_question, []))->keyBy('field_name');

                $answers = collect($answersByQ->get($q->id_question, []))->map(function($a) use ($tA) {
                    $answerTranslations = collect($tA->get($a->id_answer, []))->keyBy('field_name');
                    $txt = $answerTranslations->get('answer_text')->element_text ?? null;

                    return [
                        'id' => $a->id_answer,
                        'text' => $txt,
                        'is_correct' => (bool) $a->is_correct,
                    ];
                })->filter(fn($a) => $a['text'] !== null)->values();

                return [
                    'id' => $q->id_question,
                    'title' => $qtTranslations->get('question_title')->element_text ?? null,
                    'description' => $qtTranslations->get('question_description')->element_text ?? null,
                    'answers' => $answers,
                ];
            })->filter(fn($q) => $q['title'] !== null || count($q['answers']) > 0)->values();

            $modulesArray = $quiz->modules
                ->filter(fn($m) => strtolower($m->pivot->lang) === $lang)
                ->map(fn($m) => [
                    'id' => $m->id_module,
                    'name' => $m->name,
                    'slug' => $m->slug,
                ])->values();

            $tagsArray = $quiz->tags
                ->filter(fn($t) => strtolower($t->pivot->lang) === $lang)
                ->map(fn($t) => [
                    'id' => $t->id_tag,
                    'name' => $t->name,
                    'slug' => $t->slug,
                ])->values();

            $translations[] = [
                'lang' => $lang,
                'title' => $tQuiz->firstWhere('field_name', 'title')->element_text ?? null,
                'description' => $tQuiz->firstWhere('field_name', 'quiz_description')->element_text ?? null,
                'questions' => $quizQuestions,
                'modules' => $modulesArray,
                'tags' => $tagsArray,
                'has_translation' => true,
                'is_dirty' => false,
                'is_active' => (bool) ($actives[$lang] ?? 0),
            ];
        }

        return response()->json([
            'id_quiz' => $qid,
            'cover_image_url' => $quiz->cover_image_url ?? '',
            'questions_to_show' => $quiz->questions_to_show,
            'translations' => $translations,
        ]);
    }

    /**
     * @throws Throwable
     */
    private function saveQuiz(Request $request, ?Quiz $quiz = null): ?Quiz
    {
        $isNew = !$quiz;

        if (is_string($request->input('translations'))) {
            $request->merge([
                'translations' => json_decode($request->input('translations'), true) ?? [],
            ]);
        }

        $request->validate([
            'cover_image_url' => 'nullable|string',
            'cover_image_file' => 'nullable|file|image|max:5120',
            'translations' => 'required|array',
            'questions_to_show' => 'nullable|integer|min:1',
        ]);

        if ($isNew) {
            $quiz = new Quiz();

            $authUser = $request->user();
            if (!$authUser) throw new \Exception('Unauthenticated');

            $quiz->id_owner = (int) ($authUser->id_user ?? 0);
            $quiz->cover_image_url = $request->input('cover_image_url') ?? null;
            $quiz->save();
        }

        DB::beginTransaction();
        try {
            // --- Cover image ---
            $newCoverUrl  = $request->input('cover_image_url');
            $newCoverFile = $request->file('cover_image_file');
            $wanted = $request->input('questions_to_show');

            $oldPath = $quiz->cover_image_url
                ? ltrim(str_replace('/storage/', '', parse_url($quiz->cover_image_url, PHP_URL_PATH)), '/')
                : null;

            if ($newCoverFile) {
                if ($oldPath && Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }
                $filename = 'quiz-cards/' . uniqid() . '.' . $newCoverFile->getClientOriginalExtension();
                Storage::disk('public')->putFileAs('quiz-cards', $newCoverFile, basename($filename));
                $quiz->cover_image_url = Storage::url($filename);
            } elseif ($newCoverUrl === null) {
                if ($oldPath && Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }
                $quiz->cover_image_url = null;
            }

            $quiz->questions_to_show = ($wanted === null || $wanted === '') ? null : max(1, (int) $wanted);
            $quiz->save();

            $translations = $request->input('translations', []);

            foreach ($translations as $lang => $data) {
                $lang = strtolower((string)$lang);

                // Quiz title + description
                foreach (['title', 'description'] as $field) {
                    $fieldName = $field === 'description' ? 'quiz_description' : $field;

                    DB::table('translations')->updateOrInsert(
                        [
                            'element_type' => 'quiz',
                            'element_id' => $quiz->id_quiz,
                            'lang' => $lang,
                            'field_name' => $fieldName,
                        ],
                        ['element_text' => $data[$field] ?? '']
                    );
                }

                // Active per language
                DB::table('active_quiz')->updateOrInsert(
                    ['id_quiz' => $quiz->id_quiz, 'lang' => $lang],
                    ['is_active' => !empty($data['is_active']) ? 1 : 0]
                );

                // ✅ Modules/Tags: replace for THIS lang (avoid accumulating old ones)
                $quiz->modules()->wherePivot('lang', $lang)->detach();
                $quiz->tags()->wherePivot('lang', $lang)->detach();

                $moduleIds = collect($data['modules'] ?? [])->pluck('id')->filter()->all();
                if (!empty($moduleIds)) {
                    $sync = collect($moduleIds)->mapWithKeys(fn($id) => [(int)$id => ['lang' => $lang]])->all();
                    $quiz->modules()->attach($sync);
                }

                $tagIds = collect($data['tags'] ?? [])->pluck('id')->filter()->all();
                if (!empty($tagIds)) {
                    $sync = collect($tagIds)->mapWithKeys(fn($id) => [(int)$id => ['lang' => $lang]])->all();
                    $quiz->tags()->attach($sync);
                }

                // Questions per language
                $questions = $data['questions'] ?? [];
                $existingQuestions = DB::table('questions')
                    ->where('id_quiz', $quiz->id_quiz)
                    ->where('lang', $lang)
                    ->pluck('id_question')
                    ->all();

                $incomingQuestionIds = collect($questions)->pluck('id')->filter()->map(fn($v) => (int)$v)->all();

                $toDelete = array_diff($existingQuestions, $incomingQuestionIds);
                if (!empty($toDelete)) {
                    DB::table('answers')->whereIn('id_question', $toDelete)->delete();
                    DB::table('translations')->where('element_type', 'question')->whereIn('element_id', $toDelete)->delete();
                    DB::table('questions')->whereIn('id_question', $toDelete)->delete();
                }

                foreach ($questions as $orderIndex => $q) {
                    $questionId = isset($q['id']) && $q['id']
                        ? (int)$q['id']
                        : (int) DB::table('questions')->insertGetId([
                            'id_quiz' => $quiz->id_quiz,
                            'lang' => $lang,
                            'order' => $orderIndex + 1,
                        ]);

                    DB::table('questions')->where('id_question', $questionId)->update([
                        'order' => $orderIndex + 1
                    ]);

                    foreach (['title', 'description'] as $field) {
                        $fieldName = $field === 'description' ? 'question_description' : 'question_title';

                        DB::table('translations')->updateOrInsert(
                            [
                                'element_type' => 'question',
                                'element_id' => $questionId,
                                'lang' => $lang,
                                'field_name' => $fieldName,
                            ],
                            ['element_text' => $q[$field] ?? '']
                        );
                    }

                    $existingAnswers = DB::table('answers')->where('id_question', $questionId)->pluck('id_answer')->all();
                    $incomingAnswerIds = [];

                    // Support both old payload shape (options/correct_indices/answer_ids)
                    // and editor shape (answers: [{id,text,is_correct}])
                    if (!empty($q['answers']) && is_array($q['answers'])) {
                        foreach ($q['answers'] as $a) {
                            $txt = $a['text'] ?? null;
                            if ($txt === null || $txt === '') continue;

                            $answerId = isset($a['id']) ? (int)$a['id'] : null;
                            $isCorrect = !empty($a['is_correct']) ? 1 : 0;

                            if ($answerId && in_array($answerId, $existingAnswers)) {
                                DB::table('answers')->where('id_answer', $answerId)->update(['is_correct' => $isCorrect]);
                            } else {
                                $answerId = (int) DB::table('answers')->insertGetId([
                                    'id_question' => $questionId,
                                    'is_correct' => $isCorrect,
                                ]);
                            }

                            DB::table('translations')->updateOrInsert(
                                [
                                    'element_type' => 'answer',
                                    'element_id' => $answerId,
                                    'lang' => $lang,
                                    'field_name' => 'answer_text',
                                ],
                                ['element_text' => $txt]
                            );

                            $incomingAnswerIds[] = $answerId;
                        }
                    } else {
                        $correctIndices = $q['correct_indices'] ?? [];
                        foreach ($q['options'] ?? [] as $index => $text) {
                            if (empty($text)) continue;

                            $answerId = $q['answer_ids'][$index] ?? null;
                            $isCorrect = in_array($index, $correctIndices) ? 1 : 0;

                            if ($answerId && in_array($answerId, $existingAnswers)) {
                                DB::table('answers')->where('id_answer', $answerId)->update(['is_correct' => $isCorrect]);
                            } else {
                                $answerId = (int) DB::table('answers')->insertGetId([
                                    'id_question' => $questionId,
                                    'is_correct' => $isCorrect,
                                ]);
                            }

                            DB::table('translations')->updateOrInsert(
                                [
                                    'element_type' => 'answer',
                                    'element_id' => $answerId,
                                    'lang' => $lang,
                                    'field_name' => 'answer_text',
                                ],
                                ['element_text' => $text]
                            );

                            $incomingAnswerIds[] = $answerId;
                        }
                    }

                    $toDeleteAnswers = array_diff($existingAnswers, $incomingAnswerIds);
                    if (!empty($toDeleteAnswers)) {
                        DB::table('translations')->where('element_type', 'answer')->whereIn('element_id', $toDeleteAnswers)->delete();
                        DB::table('answers')->whereIn('id_answer', $toDeleteAnswers)->delete();
                    }
                }
            }

            DB::commit();
            return $quiz;
        } catch (Throwable $e) {
            DB::rollBack();
            logger($e);
            throw $e;
        }
    }

    private function deleteQuizQuestions(Quiz $quiz): void
    {
        $qIds = Question::where('id_quiz', $quiz->{$this->quizPk()})->pluck('id_question')->all();
        $aIds = Answer::whereIn('id_question', $qIds ?: [-1])->pluck('id_answer')->all();

        DB::table('translations')
            ->where('element_type', 'answer')
            ->whereIn('element_id', $aIds ?: [-1])
            ->delete();

        DB::table('translations')
            ->where('element_type', 'question')
            ->whereIn('element_id', $qIds ?: [-1])
            ->delete();

        Answer::whereIn('id_question', $qIds ?: [-1])->delete();
        Question::where('id_quiz', $quiz->{$this->quizPk()})->delete();
    }
}