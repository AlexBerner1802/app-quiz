<?php

namespace App\Http\Controllers;

use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TagController extends Controller
{
    private function ensureCanManage(Request $request): void
    {
        $user = $request->user();

        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        $roleId = (int) ($user->id_role ?? 0);
        if ($roleId < 2) {
            abort(403, 'Forbidden');
        }
    }

    public function index(Request $request)
    {
        $langsQuery = $request->query('langs', 'en');
        $allowed = array_filter(array_map('strtolower', explode(',', $langsQuery)));

        $tags = Tag::whereIn('lang', $allowed)
            ->orderBy('slug')
            ->get(['id_tag', 'slug', 'lang', 'name']);

        $result = [];

        foreach ($allowed as $lang) {
            $tagsForLang = $tags->where('lang', $lang)
                ->map(fn ($tag) => [
                    'id' => $tag->id_tag,
                    'name' => $tag->name,
                ])
                ->values();

            $result[$lang] = $tagsForLang;
        }

        return response()->json($result);
    }

    public function update(Request $request)
    {
        $this->ensureCanManage($request);

        $data = $request->validate([
            'tags' => ['required', 'array'],
            'tags.*' => ['array'],
            'tags.*.*.id' => ['nullable', 'integer'],
            'tags.*.*.name' => ['required', 'string', 'max:255'],

            'removedTags' => ['nullable', 'array'],
            'removedTags.*' => ['array'],
            'removedTags.*.*.id' => ['nullable', 'integer'],
        ]);

        DB::beginTransaction();

        try {
            foreach ($data['tags'] as $lang => $tagItems) {
                $lang = strtolower($lang);

                foreach ($tagItems as $tag) {
                    $name = trim($tag['name']);
                    if ($name === '') continue;

                    if (!empty($tag['id'])) {
                        Tag::where('id_tag', $tag['id'])->update([
                            'name' => $name,
                            'lang' => $lang,
                        ]);
                    } else {
                        $existing = Tag::where('lang', $lang)
                            ->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])
                            ->first();

                        if ($existing) continue;

                        $slug = strtolower(preg_replace('/[^\w-]/', '', preg_replace('/\s+/', '-', $name)));

                        Tag::create([
                            'slug' => $slug,
                            'name' => $name,
                            'lang' => $lang,
                        ]);
                    }
                }

                foreach ($data['removedTags'][$lang] ?? [] as $tag) {
                    $id = $tag['id'] ?? null;
                    if ($id) {
                        $tagModel = Tag::find($id);
                        if ($tagModel) {
                            $tagModel->quiz()->detach();
                            $tagModel->delete();
                        }
                    }
                }
            }

            DB::commit();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update tags',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}