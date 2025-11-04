<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

use App\Models\Quiz;
use App\Models\Question;
use App\Models\Answer;
use App\Models\Module;
use App\Models\Tag;

class QuizController extends Controller
{
    // GET /api/quizzes
    public function index(Request $request)
    {
        $lang = $request->input('lang', 'en'); // use string like 'en'

        $quizzes = Quiz::query()
            ->with([
                'tags:id,tag_name',
                'modules:id,module_name',
                'translations' => function($query) use ($lang) {
                    $query->where('element_type', 'quiz')
                        ->where('lang', $lang);
                },
            ])
            ->get()
            ->map(function($quiz) use ($lang, $request) {
                // extract translations for title, description, cover_image_url
                $translations = $quiz->translations->keyBy('field_name');

                $quiz->title = $translations['title']->element_text ?? null;
                $quiz->quiz_description = $translations['quiz_description']->element_text ?? null;
                $quiz->cover_image_url = $translations['cover_image_url']->element_text ?? $quiz->cover_image_url;

                // determine active state for this language
                $quiz->is_active = $quiz->activeQuizzes()
                    ->where('lang', $lang)
                    ->where('is_active', 1)
                    ->exists();

                return $quiz;
            });

        // filter only active if requested
        if ($request->boolean('only_active')) {
            $quizzes = $quizzes->filter(fn($q) => $q->is_active);
        }

        return response()->json($quizzes->values());
    }


    // GET /api/quizzes/{id}
    public function show(Request $request, $id)
    {
        $lang = $request->input('lang', 'en');

        $quiz = Quiz::with([
            'tags:id,tag_name',
            'modules:id,module_name',
            'translations' => fn($q) => $q->where('element_type', 'quiz')->where('lang', $lang),
            'activeQuizzes' => fn($q) => $q->where('lang', $lang),
            'questions.answers'
        ])->find($id); // use find() instead of findOrFail for safer debug

        if (!$quiz) {
            return response()->json(['message' => "Quiz not found for ID $id"], 404);
        }

        $translations = $quiz->translations->keyBy('field_name');
        $quiz->title = $translations['title']->element_text ?? null;
        $quiz->quiz_description = $translations['quiz_description']->element_text ?? null;
        $quiz->cover_image_url = $translations['cover_image_url']->element_text ?? $quiz->cover_image_url;

        $quiz->is_active = $quiz->activeQuizzes->where('is_active', 1)->isNotEmpty();

        if (!$quiz->is_active) {
            return response()->json(['message' => 'Quiz is inactive'], 403);
        }

        return response()->json($quiz);
    }

    // POST /api/quizzes
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'            => 'required|string|max:30',
            'quiz_description' => 'nullable|string|max:255',
            'cover_image_url'  => 'nullable|url',
            'cover_image'      => 'nullable|image|max:4096',
            'is_active'        => 'required|boolean',
            'questions'        => 'nullable',

            'module_ids'       => 'array',
            'module_ids.*'     => 'integer|exists:modules,id',
            'tag_ids'          => 'array',
            'tag_ids.*'        => 'integer|exists:tags,id',
            'new_tags'         => 'array',
            'new_tags.*'       => 'string|min:1|max:50',
        ]);

        $coverUrl = null;
        if ($request->hasFile('cover_image')) {
            $path = $request->file('cover_image')->store('quiz-cards', 'public');
            $coverUrl = url(Storage::url($path));
        } elseif (!empty($validated['cover_image_url'])) {
            $coverUrl = $validated['cover_image_url'];
        }

        $questions = $request->input('questions');
        if (is_string($questions)) {
            $questions = json_decode($questions, true) ?? [];
        } elseif (!is_array($questions)) {
            $questions = [];
        }

        DB::beginTransaction();
        try {
            $quiz = Quiz::create([
                'title'            => $validated['title'],
                'quiz_description' => $validated['quiz_description'] ?? '',
                'is_active'        => (bool) $validated['is_active'],
                'cover_image_url'  => $coverUrl,
            ]);

            foreach ($questions as $q) {
                $qTitle = $q['question_titre']       ?? $q['title']       ?? '';
                $qDesc  = $q['question_description'] ?? $q['description'] ?? null;

                $idType = isset($q['id_type'])
                    ? (int) $q['id_type']
                    : ((count($q['correctIndices'] ?? []) > 1) ? 2 : 1);

                $question = Question::create([
                    'id_quiz'              => $quiz->id,
                    'id_type'              => $idType,
                    'question_titre'       => $qTitle,
                    'question_description' => $qDesc,
                ]);

                $opts    = $q['options'] ?? [];
                $correct = $q['correctIndices'] ?? [];
                foreach ($opts as $idx => $text) {
                    Answer::create([
                        'id_question' => $question->id,
                        'answer_text'  => $text ?? '',
                        'is_correct'   => in_array($idx, $correct) ? 1 : 0,
                    ]);
                }
            }

            $moduleIds = $validated['module_ids'] ?? [];
            if (!empty($moduleIds)) {
                $quiz->modules()->sync($moduleIds);
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
            if (!empty($tagIds) || !empty($createdTagIds)) {
                $quiz->tags()->sync(array_merge($tagIds, $createdTagIds));
            }

            DB::commit();

            $fresh = Quiz::select('id','title','quiz_description','cover_image_url','is_active','created_at','updated_at')
                ->with(['modules:id,module_name','tags:id,tag_name'])
                ->find($quiz->id);

            return response()->json($fresh, 201);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error while creating the quiz', 'error' => $e->getMessage()], 500);
        }
    }

    // PUT/PATCH /api/quizzes/{id}
    public function update(Request $request, $id)
    {
        $quiz = Quiz::findOrFail($id);

        $validated = $request->validate([
            'title'            => 'required|string|max:30',
            'quiz_description' => 'nullable|string|max:255',
            'cover_image_url'  => 'nullable|url',
            'cover_image'      => 'nullable|image|max:4096',
            'is_active'        => 'required|boolean',

            'module_ids'       => 'array',
            'module_ids.*'     => 'integer|exists:modules,id',
            'tag_ids'          => 'array',
            'tag_ids.*'        => 'integer|exists:tags,id',
            'new_tags'         => 'array',
            'new_tags.*'       => 'string|min:1|max:50',
            'questions'        => 'nullable',
        ]);

        if ($request->hasFile('cover_image')) {
            $path = $request->file('cover_image')->store('quiz-cards', 'public');
            $quiz->cover_image_url = url(Storage::url($path));
        } elseif (!empty($validated['cover_image_url'])) {
            $quiz->cover_image_url = $validated['cover_image_url'];
        }

        $quiz->title            = $validated['title'];
        $quiz->quiz_description = $validated['quiz_description'] ?? '';
        $quiz->is_active        = (bool) $validated['is_active'];

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

            if ($request->has('questions')) {
                $questions = $request->input('questions');
                if (is_string($questions)) $questions = json_decode($questions, true) ?? [];
                if (!is_array($questions))  $questions = [];

                foreach ($quiz->questions as $q) {
                    $q->answers()->delete();
                }
                $quiz->questions()->delete();

                foreach ($questions as $q) {
                    $qTitle = $q['question_titre']       ?? $q['title']       ?? '';
                    $qDesc  = $q['question_description'] ?? $q['description'] ?? null;
                    $idType = isset($q['id_type'])
                        ? (int)$q['id_type']
                        : ((count($q['correctIndices'] ?? []) > 1) ? 2 : 1);

                    $question = Question::create([
                        'id_quiz'              => $quiz->id,
                        'id_type'              => $idType,
                        'question_titre'       => $qTitle,
                        'question_description' => $qDesc,
                    ]);

                    $opts    = $q['options'] ?? [];
                    $correct = $q['correctIndices'] ?? [];
                    foreach ($opts as $idx => $text) {
                        Answer::create([
                            'id_questions' => $question->id,
                            'answer_text'  => $text ?? '',
                            'is_correct'   => in_array($idx, $correct) ? 1 : 0,
                        ]);
                    }
                }
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error while updating the quiz', 'error' => $e->getMessage()], 500);
        }

        $fresh = Quiz::select('id','title','quiz_description','cover_image_url','is_active','created_at','updated_at')
            ->with(['modules:id,module_name','tags:id,tag_name'])
            ->find($quiz->id);

        return response()->json($fresh, 200);
    }

    // DELETE /api/quizzes/{id}
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
}
