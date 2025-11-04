<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    protected $table = 'questions';
    protected $primaryKey = 'id_question';
    public $timestamps = true;

    protected $fillable = ['id_type','id_quiz','order'];
    protected $casts = [
        'order'  => 'integer',
        'id_type'=> 'integer',
        'id_quiz'=> 'integer',
    ];

    public function quiz()
    {
        return $this->belongsTo(Quiz::class, 'id_quiz', 'id_quiz');
    }

    public function type()
    {
        return $this->belongsTo(TypeQuestion::class, 'id_type', 'id');
    }

    public function answers()
    {
        return $this->hasMany(Answer::class, 'id_question', 'id_question');
    }

    // i18n
    public function translations()
    {
        return $this->hasMany(Translation::class, 'question_id', 'id_question')
                    ->where('element_type', 'question');
    }
}
