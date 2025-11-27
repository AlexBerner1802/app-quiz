<?php

namespace App\Http\Controllers;

use App\Models\Module;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ModuleController extends Controller
{
    public function index(Request $request)
    {
        $langsQuery = $request->query('langs', 'en');
        $allowed = array_filter(array_map('strtolower', explode(',', $langsQuery)));

        $modules = Module::orderBy('slug')->get(['id_module', 'slug']);

        // Fetch all translations for the allowed languages
        $translations = DB::table('translations')
            ->where('element_type', 'module')
            ->whereIn('element_id', $modules->pluck('id_module'))
            ->whereIn('lang', $allowed)
            ->where('field_name', 'name')
            ->get()
            ->groupBy(['lang', 'element_id']);

        $result = [];

        foreach ($allowed as $lang) {
            $modulesForLang = $modules->map(function ($module) use ($translations, $lang) {
                $moduleTranslations = $translations[$lang][$module->id_module] ?? collect();
                $translatedName = $moduleTranslations->first()?->element_text ?? null;
                if (!$translatedName) return null;
                return [
                    'id' => $module->id_module,
                    'name' => $translatedName,
                ];
            })->filter()->values();

            if ($modulesForLang->isNotEmpty()) {
                $result[$lang] = $modulesForLang;
            }
        }

        return response()->json($result);
    }

    public function store(Request $r)
    {
        $data = $r->validate([
            'slug' => 'required|string|min:1|max:255|unique:modules,slug',
        ]);
        return Module::create($data);
    }
}
