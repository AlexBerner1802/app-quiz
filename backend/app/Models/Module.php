<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Module extends Model
{
    protected $table = 'modules';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = ['module_name'];

    public function quizzes()
    {
        return $this->belongsToMany(Quiz::class, 'quiz_modules', 'id_module', 'id_quiz')
                    ->withTimestamps();
    }
}

