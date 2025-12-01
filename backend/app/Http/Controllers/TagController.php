<?php

namespace App\Http\Controllers;

use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TagController extends Controller
{
    // Fetch tags with translations
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
                ->map(function ($tag) {
                    return [
                        'id' => $tag->id_tag,
                        'name' => $tag->name,
                    ];
                })
                ->values();

            $result[$lang] = $tagsForLang;
        }

        return response()->json($result);
    }

    // Update tags in bulk: add new + delete removed
    public function update(Request $request)
    {
        $data = $request->validate([
            'tags' => 'required|array',      // input: { en: [..], fr: [..], ... }
            'removedTags' => 'array',
        ]);

        DB::beginTransaction();

        try {
            foreach ($data['tags'] as $lang => $tagItems) {
                $lang = strtolower($lang);

                foreach ($tagItems as $tag) {
                    $name = trim($tag['name']);
                    if ($name === '') continue;

                    if (!empty($tag['id'])) {
                        // Update existing tag
                        Tag::where('id_tag', $tag['id'])
                            ->update([
                                'name' => $name,
                                'lang' => $lang,
                            ]);
                    } else {
                        // Create new tag
                        $slug = strtolower(preg_replace('/[^\w-]/', '', preg_replace('/\s+/', '-', $name)));

                        Tag::create([
                            'slug' => $slug,
                            'name' => $name,
                            'lang' => $lang,
                        ]);
                    }
                }

                // --- Remove deleted tags ---
                foreach ($data['removedTags'][$lang] ?? [] as $tag) {
                    $id = $tag['id'] ?? null;
                    if ($id) {
                        Tag::where('id_tag', $id)->delete();
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
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }


}
