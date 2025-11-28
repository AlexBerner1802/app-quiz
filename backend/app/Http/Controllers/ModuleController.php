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

    public function update(Request $request)
    {
        $data = $request->validate([
            'modules' => 'required|array',
            'removedModules' => 'array',
        ]);

        DB::beginTransaction();
        try {
            foreach ($data['modules'] as $lang => $moduleItems) {
                $lang = strtolower($lang);

                foreach ($moduleItems as $module) {
                    $name = trim($module['name']);
                    if ($name === '') continue;

                    if (!empty($module['id'])) {
                        // Update existing module
                        DB::table('translations')
                            ->where('element_type', 'module')
                            ->where('element_id', $module['id'])
                            ->where('lang', $lang)
                            ->where('field_name', 'name')
                            ->update(['element_text' => $name]);
                    } else {
                        // New module
                        $slug = strtolower(preg_replace('/[^\w-]/', '', preg_replace('/\s+/', '-', $name)));
                        $newModule = Module::create(['slug' => $slug]);
                        DB::table('translations')->insert([
                            'element_type' => 'module',
                            'element_id' => $newModule->id_module,
                            'field_name' => 'name',
                            'lang' => $lang,
                            'element_text' => $name,
                        ]);
                    }
                }

                // Remove deleted modules
                foreach ($data['removedModules'][$lang] ?? [] as $module) {
                    $id = $module['id'] ?? null;
                    if ($id) {
                        DB::table('translations')
                            ->where('element_type', 'module')
                            ->where('element_id', $id)
                            ->where('lang', $lang)
                            ->where('field_name', 'name')
                            ->delete();

                        Module::where('id_module', $id)->delete();
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
