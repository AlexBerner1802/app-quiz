<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Quiz extends Model
{
    protected $table = 'quiz';
    protected $primaryKey = 'id_quiz';
    public $timestamps = true;

    protected $fillable = [];
    protected $guarded  = [];

    // Structural relations
    public function questions()
    {
        return $this->hasMany(Question::class, 'id_quiz', 'id_quiz');
    }

    public function modules()
    {
        return $this->belongsToMany(Module::class, 'quiz_modules', 'id_quiz', 'id_module')
                    ->withTimestamps();
    }

    public function tags()
    {
        return $this->belongsToMany(Tag::class, 'quiz_tags', 'id_quiz', 'id_tag')
                    ->withTimestamps();
    }

    /* i18n : translations & activation per language */
    public function translations()
    {
        return $this->hasMany(Translation::class, 'quiz_id', 'id_quiz')
                    ->where('element_type', 'quiz');
    }

    public function actives()
    {
        return $this->hasMany(ActiveQuiz::class, 'id_quiz', 'id_quiz');
    }

    // Helpers
    public function isActiveForLang(int $langId): bool
    {
        return (bool) $this->actives()->where('lang', $langId)->value('is_active');
    }
}
