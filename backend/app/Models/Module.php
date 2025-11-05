<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Module extends Model
{
    protected $table = 'modules';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = ['module_name'];

    public function quizzes(): BelongsToMany
    {
        return $this->belongsToMany(Quiz::class, 'quiz_modules', 'id_module', 'id_quiz')
                    ->withTimestamps();
    }
}

