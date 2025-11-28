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

        $modules = Module::whereIn('lang', $allowed)
            ->orderBy('slug')
            ->get(['id_module', 'slug', 'lang', 'name']);

        $result = [];

        foreach ($allowed as $lang) {
            $modulesForLang = $modules->where('lang', $lang)
                ->map(function ($module) {
                    return [
                        'id' => $module->id_module,
                        'name' => $module->name,
                    ];
                })->values();

            $result[$lang] = $modulesForLang;
        }

        return response()->json($result);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'modules' => 'required|array',       // modules from frontend
            'removedModules' => 'array',         // optional removed modules
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
                        Module::where('id_module', $module['id'])
                            ->update([
                                'name' => $name,
                                'lang' => $lang,
                            ]);
                    } else {
                        // Create new module
                        $slug = strtolower(preg_replace('/[^\w-]/', '', preg_replace('/\s+/', '-', $name)));
                        Module::create([
                            'slug' => $slug,
                            'name' => $name,
                            'lang' => $lang,
                        ]);
                    }
                }

                // Remove deleted modules
                foreach ($data['removedModules'][$lang] ?? [] as $module) {
                    $id = $module['id'] ?? null;
                    if ($id) {
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
