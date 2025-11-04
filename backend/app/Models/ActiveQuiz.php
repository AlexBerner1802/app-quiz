<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActiveQuiz extends Model
{
    protected $table = 'active_quiz';
    public $timestamps = true;

    protected $fillable = ['id_quiz','lang','is_active'];
    protected $casts = ['is_active'=>'boolean'];

    public function quiz()
    {
        return $this->belongsTo(Quiz::class, 'id_quiz', 'id_quiz');
    }
}
