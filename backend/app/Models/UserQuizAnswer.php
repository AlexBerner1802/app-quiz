<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserQuizAnswer extends Model
{
    protected $table = 'users_quiz_answers';
    protected $fillable = ['id_user','id_quiz','id_questions','id_answers'];
    public $timestamps = true;

    public function user()     { return $this->belongsTo(User::class, 'id_user', 'UUID'); }
    public function quiz()     { return $this->belongsTo(Quiz::class, 'id_quiz', 'id_quiz'); }
    public function question() { return $this->belongsTo(Question::class, 'id_question', 'id_question'); }
    public function answer()   { return $this->belongsTo(Answer::class, 'id_answers', 'id_answer'); }
}
