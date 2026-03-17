<?php

namespace App\Http\Controllers;

use App\Models\Module;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ModuleController extends Controller
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

        $modules = Module::whereIn('lang', $allowed)
            ->orderBy('slug')
            ->get(['id_module', 'slug', 'lang', 'name']);

        $result = [];

        foreach ($allowed as $lang) {
            $modulesForLang = $modules->where('lang', $lang)
                ->map(fn ($module) => [
                    'id' => $module->id_module,
                    'name' => $module->name,
                ])
                ->values();

            $result[$lang] = $modulesForLang;
        }

        return response()->json($result);
    }

    public function update(Request $request)
    {
        $this->ensureCanManage($request);

        $data = $request->validate([
            'modules' => ['required', 'array'],
            'modules.*' => ['array'],
            'modules.*.*.id' => ['nullable', 'integer'],
            'modules.*.*.name' => ['required', 'string', 'max:255'],

            'removedModules' => ['nullable', 'array'],
            'removedModules.*' => ['array'],
            'removedModules.*.*.id' => ['nullable', 'integer'],
        ]);

        DB::beginTransaction();

        try {
            foreach ($data['modules'] as $lang => $moduleItems) {
                $lang = strtolower($lang);

                foreach ($moduleItems as $module) {
                    $name = trim($module['name']);
                    if ($name === '') continue;

                    if (!empty($module['id'])) {
                        Module::where('id_module', $module['id'])->update([
                            'name' => $name,
                            'lang' => $lang,
                        ]);
                    } else {
                        $existing = Module::where('lang', $lang)
                            ->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])
                            ->first();

                        if ($existing) continue;

                        $slug = strtolower(preg_replace('/[^\w-]/', '', preg_replace('/\s+/', '-', $name)));

                        Module::create([
                            'slug' => $slug,
                            'name' => $name,
                            'lang' => $lang,
                        ]);
                    }
                }

                foreach ($data['removedModules'][$lang] ?? [] as $module) {
                    $id = $module['id'] ?? null;
                    if ($id) {
                        $moduleModel = Module::find($id);
                        if ($moduleModel) {
                            $moduleModel->quiz()->detach();
                            $moduleModel->delete();
                        }
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
            ], 500);
        }
    }
}