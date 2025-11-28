<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Module extends Model
{
    protected $table = 'modules';
    protected $primaryKey = 'id_module';
    public $timestamps = true;

    protected $fillable = ['slug', 'name', 'lang'];

    public function quiz(): BelongsToMany
    {
        return $this->belongsToMany(
            Quiz::class,
            'quiz_modules',
            'id_module', // FK on pivot pointing to Module
            'id_quiz'    // FK on pivot pointing to Quiz
        )->withTimestamps();
    }
}

