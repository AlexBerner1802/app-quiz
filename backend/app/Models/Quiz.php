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

    protected $fillable = ['cover_image_url', 'owner_id'];

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

    public function modules(): BelongsToMany
    {
        return $this->belongsToMany(
            Module::class,
            'quiz_modules',
            'id_quiz',   // FK on pivot pointing to Quiz
            'id_module'  // FK on pivot pointing to Module
        )->withTimestamps();
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(
            Tag::class,
            'quiz_tags',
            'id_quiz',  // FK on pivot pointing to Quiz
            'id_tag'    // FK on pivot pointing to Tag
        )->withTimestamps();
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
