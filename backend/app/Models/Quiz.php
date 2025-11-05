<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quiz extends Model
{
    protected $table = 'quiz';
    protected $primaryKey = 'id_quiz';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = true;

    protected $fillable = [
        'cover_image_url',
    ];

    /**
     * Relationships
     */

    // A quiz has many questions
    public function questions(): HasMany
    {
        return $this->hasMany(Question::class, 'id_quiz', 'id_quiz')->orderBy('order');
    }

    // A quiz can have many translations
    public function translations(): HasMany
    {
        return $this->hasMany(Translation::class, 'quiz_id', 'id_quiz')->where('element_type', 'quiz');
    }

    // A quiz can have many modules
    public function modules(): BelongsToMany
    {
        return $this->belongsToMany(Module::class, 'quiz_modules', 'id_quiz', 'id_module')->withTimestamps();
    }

    // A quiz can have many tags
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'quiz_tags', 'id_quiz', 'id_tag')->withTimestamps();
    }

    // A quiz can be activated for multiple languages
    public function activeQuizzes(): HasMany
    {
        return $this->hasMany(ActiveQuiz::class, 'id_quiz', 'id_quiz');
    }

    // A quiz can have many user answers
    public function userAnswers(): HasMany
    {
        return $this->hasMany(UserQuizAnswer::class, 'id', 'id_quiz');
    }
}
