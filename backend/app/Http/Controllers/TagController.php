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

        $tags = Tag::orderBy('slug')->get(['id_tag', 'slug']);

        $translations = DB::table('translations')
            ->where('element_type', 'tag')
            ->whereIn('element_id', $tags->pluck('id_tag'))
            ->whereIn('lang', $allowed)
            ->where('field_name', 'name')
            ->get()
            ->groupBy(['lang', 'element_id']);

        $result = [];

        foreach ($allowed as $lang) {
            $tagsForLang = $tags->map(function ($tag) use ($translations, $lang) {
                $tagTranslations = $translations[$lang][$tag->id_tag] ?? collect();
                $translatedName = $tagTranslations->first()?->element_text ?? null;
                if (!$translatedName) return null;
                return [
                    'id' => $tag->id_tag,
                    'name' => $translatedName,
                ];
            })->filter()->values();

            if ($tagsForLang->isNotEmpty()) {
                $result[$lang] = $tagsForLang;
            }
        }

        return response()->json($result);
    }

    // Update tags in bulk: add new + delete removed
    public function update(Request $request)
    {
        $data = $request->validate([
            'tags' => 'required|array',
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
                        // Existing tag, maybe update name if needed
                        DB::table('translations')
                            ->where('element_type', 'tag')
                            ->where('element_id', $tag['id'])
                            ->where('lang', $lang)
                            ->where('field_name', 'name')
                            ->update(['element_text' => $name]);
                    } else {
                        // New tag
                        $slug = strtolower(preg_replace('/[^\w-]/', '', preg_replace('/\s+/', '-', $name)));
                        $newTag = Tag::create(['slug' => $slug]);
                        DB::table('translations')->insert([
                            'element_type' => 'tag',
                            'element_id' => $newTag->id_tag,
                            'field_name' => 'name',
                            'lang' => $lang,
                            'element_text' => $name,
                        ]);
                    }
                }

                // Remove deleted tags
                foreach ($data['removedTags'][$lang] ?? [] as $tag) {
                    $id = $tag['id'] ?? null;
                    if ($id) {
                        DB::table('translations')
                            ->where('element_type', 'tag')
                            ->where('element_id', $id)
                            ->where('lang', $lang)
                            ->where('field_name', 'name')
                            ->delete();

                        Tag::where('id_tag', $id)->delete();
                    }
                }
            }

            DB::commit();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update modules',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }



}
