<?php

namespace App\Http\Controllers;

use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TagController extends Controller
{
    public function index(Request $request)
    {
        // Requested languages (default to 'en')
        $langsQuery = $request->query('langs', 'en');
        $allowed = array_filter(array_map('strtolower', explode(',', $langsQuery)));

        // Fetch all tags
        $tags = Tag::orderBy('slug')->get(['id_tag', 'slug']);

        // Fetch all translations for the allowed languages
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

    public function store(Request $r)
    {
        $data = $r->validate([
            'slug' => 'required|string|min:1|max:50|unique:tags,slug',
        ]);
        return Tag::create($data);
    }
}
