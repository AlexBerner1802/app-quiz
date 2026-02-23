<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('quiz', function (Blueprint $table) {
            $table->unsignedInteger('questions_to_show')->nullable()->after('id_owner');
        });
    }

    public function down()
    {
        Schema::table('quiz', function (Blueprint $table) {
            $table->dropColumn('questions_to_show');
        });
    }
};
