<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

use App\Models\Quiz;
use App\Models\Question;
use App\Models\Answer;


class QuizController extends Controller
{

    private function quizPk(): string { return 'id_quiz'; }

    public function index(Request $request): JsonResponse
    {
        try {
            $lang = strtolower($request->query('lang', 'en'));
            $ownerId = (string) $request->query('owner_id');

            // Load quizzes with relations
            $quizzes = Quiz::with([
                'modules:id_module,name,slug',
                'tags:id_tag,name,slug',
                'activeQuizzes' => fn($q) => $q->where('lang', $lang)
            ])
                ->where(function($q) use ($ownerId) {
                    // Only include quizzes that are active OR owned by this owner
                    $q->whereHas('activeQuizzes', fn($aq) => $aq->where('is_active', 1))
                        ->orWhere(function($q2) use ($ownerId) {
                            $q2->where('owner_id', $ownerId);
                        });
                })
                ->get();

            if ($quizzes->isEmpty()) {
                return response()->json([]);
            }

            // Fetch translations
            $quizIds = $quizzes->pluck('id_quiz')->all();
            $tRows = DB::table('translations')
                ->where('element_type', 'quiz')
                ->where('lang', $lang)
                ->whereIn('element_id', $quizIds)
                ->whereIn('field_name', ['title', 'quiz_description', 'cover_image_url'])
                ->get()
                ->groupBy('element_id');

            // Map quizzes
            $mapped = $quizzes->map(function ($quiz) use ($tRows, $lang) {
                $qid = $quiz->id_quiz;
                $tmap = collect($tRows->get($qid, []))->keyBy('field_name');

                $activeRecord = $quiz->activeQuizzes->first();
                $isActive = $activeRecord ? (bool)$activeRecord->is_active : false;

                return [
                    'id_quiz'         => $qid,
                    'lang'            => $lang,
                    'title'           => optional($tmap->get('title'))->element_text ?? '',
                    'description'     => optional($tmap->get('quiz_description'))->element_text ?? '',
                    'cover_image_url' => optional($tmap->get('cover_image_url'))->element_text ?? $quiz->cover_image_url,
                    'modules'         => $quiz->modules->map(fn($m) => ['id' => $m->id_module, 'name' => $m->name])->values(),
                    'tags'            => $quiz->tags->map(fn($t) => ['id' => $t->id_tag, 'name' => $t->name])->values(),
                    'is_active'       => $isActive,
                    'owner_id'        => $quiz->owner_id,
                    'created_at'      => $quiz->created_at,
                    'updated_at'      => $quiz->updated_at,
                ];
            });

            return response()->json($mapped->values()->all());

        } catch (\Throwable $e) {
            return response()->json([
                'request' => $request->all(),
                'message' => 'Error mapping quizzes',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    public function show(Request $request, $id): JsonResponse
    {
        try {
            $lang = strtolower($request->query('lang', 'en'));

            $quiz = Quiz::with([
                'modules:id_module,slug,name',
                'tags:id_tag,slug,name'
            ])->find($id);

            if (!$quiz) {
                return response()->json(['message' => "Quiz not found for ID $id"], 404);
            }

            $qid = $quiz->{$this->quizPk()};

            $isActive = DB::table('active_quiz')
                ->where('id_quiz', $qid)
                ->where('lang', $lang)
                ->value('is_active');

            if (!$isActive) {
                return response()->json(['message' => 'Quiz is inactive'], 403);
            }

            $tQuiz = DB::table('translations')
                ->where('element_type', 'quiz')
                ->where('lang', $lang)
                ->where('element_id', $qid)
                ->whereIn('field_name', ['title', 'quiz_description', 'cover_image_url'])
                ->get()
                ->keyBy('field_name');

            $title       = optional($tQuiz->get('title'))->element_text ?? '';
            $desc        = optional($tQuiz->get('quiz_description'))->element_text ?? '';
            $coverImage  = optional($tQuiz->get('cover_image_url'))->element_text ?? $quiz->cover_image_url;

            $questions = DB::table('questions')
                ->where('id_quiz', $qid)
                ->where('lang', $lang)
                ->orderBy('order')
                ->get();

            if ($questions->isEmpty()) {
                $qIds = [];
            } else {
                $qIds = $questions->pluck('id_question')->all();
            }

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

            $questionBlocks = collect($questions)->map(function ($q) use ($answers, $tQuestions, $tAnswers) {
                $qt = collect($tQuestions->get($q->id_question, []))->keyBy('field_name');

                $title = optional($qt->get('question_title'))->element_text ?? '';
                $desc  = optional($qt->get('question_description'))->element_text ?? '';

                $ans = collect($answers->get($q->id_question, []))->map(function ($a) use ($tAnswers) {
                    $txt = optional(collect($tAnswers->get($a->id_answer, []))->first())->element_text ?? '';
                    return [
                        'id'         => $a->id_answer,
                        'text'       => $txt,
                        'is_correct' => (bool) $a->is_correct,
                    ];
                })->values();

                return [
                    'id'          => $q->id_question,
                    'title'       => $title,
                    'description' => $desc,
                    'answers'     => $ans,
                ];
            })->values();

            return response()->json([
                $this->quizPk()    => $qid,
                'lang'             => $lang,
                'title'            => $title,
                'description'      => $desc,
                'cover_image_url'  => $coverImage,
                'is_active'        => (bool) $isActive,

                'modules' => collect($quiz->modules)
                    ->map(fn($m) => ['id' => $m->id_module, 'name' => $m->name, 'slug' => $m->slug])
                    ->values(),

                'tags' => collect($quiz->tags)
                    ->map(fn($t) => ['id' => $t->id_tag, 'name' => $t->name, 'slug' => $t->slug])
                    ->values(),

                'questions' => $questionBlocks,
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Error loading quiz',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $quiz = $this->saveQuiz($request, null);
        return response()->json(['quiz' => $quiz], 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $quiz = Quiz::find($id);
        if (!$quiz) {
            return response()->json([
                'error_code' => 'quiz_not_found',
                'message' => 'Quiz not found for ID '.$id
            ], 404);
        }

        // Make sure quiz has an owner
        if (!$quiz->owner_id || $quiz->owner_id != $request->input('owner_id')) {
            return response()->json([
                'error_code' => 'unauthorized_quiz',
                'message' => "Unauthorized: you are not the owner"
            ], 403);
        }

        $quiz = $this->saveQuiz($request, $quiz);
        return response()->json(['quiz' => $quiz], 200);
    }

    private function saveQuiz(Request $request, ?Quiz $quiz = null): ?Quiz
    {
        $isNew = !$quiz;
        if ($isNew) {
            if (is_string($request->input('translations'))) {
                $request->merge([
                    'translations' => json_decode($request->input('translations'), true) ?? [],
                ]);
            }

            // Validate first
            $request->validate([
                'cover_image_url' => 'nullable|string',
                'owner_id' => 'required|string',
                'cover_image_file' => 'nullable|file|image|max:5120',
                'translations' => 'required|array',
            ]);

            $quiz = new Quiz();
            $quiz->cover_image_url = $request->input('cover_image_url') ?? null;
            $quiz->owner_id = (string) $request->input('owner_id');
            $quiz->save();
        }

        // Decode translations if sent as JSON string
        if (is_string($request->input('translations'))) {
            $request->merge([
                'translations' => json_decode($request->input('translations'), true) ?? [],
            ]);
        }

        $request->validate([
            'cover_image_url' => 'nullable|string',
            'cover_image_file' => 'nullable|file|image|max:5120',
            'translations' => 'required|array',
        ]);

        DB::beginTransaction();
        try {
            // --- Handle cover image ---
            $newCoverUrl  = $request->input('cover_image_url');
            $newCoverFile = $request->file('cover_image_file');
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

            $quiz->save();

            // --- Handle translations per language ---
            $translations = $request->input('translations', []);
            foreach ($translations as $lang => $data) {

                // --- Quiz title and description translations ---
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

                // --- Active flag per language ---
                DB::table('active_quiz')->updateOrInsert(
                    ['id_quiz' => $quiz->id_quiz, 'lang' => $lang],
                    ['is_active' => !empty($data['is_active']) ? 1 : 0]
                );

                // --- Modules & tags per language ---
                $moduleIds = collect($data['modules'] ?? [])->pluck('id')->filter()->all();
                $quiz->modules()->sync($moduleIds);

                $tagIds = collect($data['tags'] ?? [])->pluck('id')->filter()->all();
                $quiz->tags()->sync($tagIds);

                // --- Questions & answers per language ---
                $questions = $data['questions'] ?? [];
                $existingQuestions = DB::table('questions')->where('id_quiz', $quiz->id_quiz)->where('lang', $lang)->pluck('id_question')->all();
                $incomingQuestionIds = collect($questions)->pluck('id')->filter()->all();

                // Delete removed questions
                $toDelete = array_diff($existingQuestions, $incomingQuestionIds);
                if (!empty($toDelete)) {
                    DB::table('answers')->whereIn('id_question', $toDelete)->delete();
                    DB::table('translations')->where('element_type', 'question')->whereIn('element_id', $toDelete)->delete();
                    DB::table('questions')->whereIn('id_question', $toDelete)->delete();
                }

                foreach ($questions as $orderIndex => $q) {
                    // Insert or update question
                    $questionId = $q['id'] ?? DB::table('questions')->insertGetId([
                        'id_quiz' => $quiz->id_quiz,
                        'lang' => $lang,
                        'order' => $orderIndex + 1,
                    ]);
                    if (!isset($q['id'])) {
                        DB::table('questions')->where('id_question', $questionId)->update(['order' => $orderIndex + 1]);
                    }

                    // Question translations
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

                    // Answers
                    $existingAnswers = DB::table('answers')->where('id_question', $questionId)->pluck('id_answer')->all();
                    $incomingAnswerIds = [];
                    $correctIndices = $q['correct_indices'] ?? [];

                    foreach ($q['options'] ?? [] as $index => $text) {
                        if (empty($text)) continue;
                        $answerId = $q['answer_ids'][$index] ?? null;
                        $isCorrect = in_array($index, $correctIndices) ? 1 : 0;

                        if ($answerId && in_array($answerId, $existingAnswers)) {
                            DB::table('answers')->where('id_answer', $answerId)->update(['is_correct' => $isCorrect]);
                        } else {
                            $answerId = DB::table('answers')->insertGetId([
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

                    // Delete removed answers
                    $toDeleteAnswers = array_diff($existingAnswers, $incomingAnswerIds);
                    if (!empty($toDeleteAnswers)) {
                        DB::table('translations')->where('element_type', 'answer')->whereIn('element_id', $toDeleteAnswers)->delete();
                        DB::table('answers')->whereIn('id_answer', $toDeleteAnswers)->delete();
                    }
                }
            }

            DB::commit();
            return $quiz;

        } catch (\Throwable $e) {
            DB::rollBack();
            logger($e);
            throw $e;
        }
    }

    public function destroy($id): Response
    {
        $quiz = Quiz::findOrFail($id);

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
        $langsQuery = $request->query('langs', 'en');
        $allowed = array_filter(array_map('strtolower', explode(',', $langsQuery)));

        $quiz = Quiz::with(['modules:id_module', 'tags:id_tag'])->find($id);
        if (!$quiz) {
            return response()->json(['message' => "Quiz not found for ID $id"], 404);
        }

        $qid = $quiz->{$this->quizPk()};

        // Determine which languages are present for this quiz
        $langsPresent = DB::table('translations')
            ->where('element_type', 'quiz')
            ->where('element_id', $qid)
            ->distinct()
            ->pluck('lang')
            ->filter(fn($l) => in_array($l, $allowed, true))
            ->values()
            ->all();

        if (empty($langsPresent)) {
            return response()->json([
                'id_quiz' => $qid,
                'modules' => [],
                'tags' => [],
                'cover_image_url' => $quiz->cover_image_url ?? '',
                'translations' => [],
            ]);
        }

        // Fetch active flags per language
        $actives = DB::table('active_quiz')
            ->where('id_quiz', $qid)
            ->whereIn('lang', $langsPresent)
            ->pluck('is_active', 'lang');

        $moduleIds = $quiz->modules->pluck('id_module')->all();
        $tagIds = $quiz->tags->pluck('id_tag')->all();

        $translations = [];

        foreach ($langsPresent as $lang) {
            // Fetch questions for this language
            $questions = DB::table('questions')
                ->where('id_quiz', $qid)
                ->where('lang', $lang)
                ->orderBy('order')
                ->get();

            $qIds = $questions->pluck('id_question')->all();

            // Fetch answers for these questions
            $answersByQ = DB::table('answers')
                ->whereIn('id_question', $qIds ?: [-1])
                ->get()
                ->groupBy('id_question');

            $answerIds = $answersByQ->flatten()->pluck('id_answer')->all();

            // Pre-load all translations for this language
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
            $modulesTranslated = $allTranslations['module'] ?? collect();
            $tagsTranslated = $allTranslations['tag'] ?? collect();

            // Build questions array (language-specific)
            $quizQuestions = collect($questions)->map(function($q) use ($answersByQ, $tQ, $tA) {
                // Wrap the question translations in a collection
                $qtTranslations = collect($tQ->get($q->id_question, []))->keyBy('field_name');

                // Wrap the answers for this question in a collection
                $answers = collect($answersByQ->get($q->id_question, []))->map(function($a) use ($tA) {
                    $answerTranslations = collect($tA->get($a->id_answer, []))->keyBy('field_name');
                    return [
                        'id' => $a->id_answer,
                        'text' => $answerTranslations->get('answer_text')->element_text ?? null,
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

            // Build modules array (language-specific, only if translation exists)
            $modulesArray = collect($moduleIds)->map(function($id) use ($modulesTranslated) {
                $label = $modulesTranslated->get($id, collect())->first()?->element_text;
                return $label ? ['id' => $id, 'label' => $label] : null;
            })->filter()->values();

            // Build tags array (language-specific, only if translation exists)
            $tagsArray = collect($tagIds)->map(function($id) use ($tagsTranslated) {
                $label = $tagsTranslated->get($id, collect())->first()?->element_text;
                return $label ? ['id' => $id, 'label' => $label] : null;
            })->filter()->values();

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
            'translations' => $translations,
        ]);
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
