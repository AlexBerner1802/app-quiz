<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Tag extends Model
{
    protected $table = 'tags';
    protected $primaryKey = 'id_tag';
    public $timestamps = true;

    protected $fillable = ['slug'];

    public function quiz(): BelongsToMany
    {
        return $this->belongsToMany(
            Quiz::class,
            'quiz_tags',
            'id_tag',  // FK on pivot pointing to Tag
            'id_quiz'  // FK on pivot pointing to Quiz
        )->withTimestamps();
    }
}
