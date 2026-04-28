<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->string('location');
            $table->dateTime('start_date');
            $table->dateTime('end_date');
            $table->enum('category', ['musik','olahraga','teknologi','seni','pendidikan','lainnya']);
            $table->string('banner_url')->nullable();
            $table->unsignedBigInteger('organizer_id')->comment('user_id dari auth-service');
            $table->enum('status', ['draft','published','cancelled'])->default('draft');
            $table->integer('total_tickets')->default(0);
            $table->integer('sold_tickets')->default(0);
            $table->timestamps();

            $table->index(['category', 'status']);
            $table->index('start_date');
        });

        Schema::create('ticket_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('price', 12, 2);
            $table->integer('quota');
            $table->integer('sold')->default(0);
            $table->timestamps();
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_code')->unique();
            $table->unsignedBigInteger('user_id')->comment('dari auth-service');
            $table->foreignId('event_id')->constrained()->onDelete('restrict');
            $table->foreignId('ticket_category_id')->constrained()->onDelete('restrict');
            $table->integer('quantity');
            $table->decimal('total_price', 12, 2);
            $table->enum('status', ['pending','paid','cancelled'])->default('pending');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('order_code');
        });

        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->foreignId('event_id')->constrained()->onDelete('restrict');
            $table->foreignId('ticket_category_id')->constrained()->onDelete('restrict');
            $table->unsignedBigInteger('user_id');
            $table->string('qr_code')->unique();
            $table->enum('status', ['active','used','cancelled'])->default('active');
            $table->timestamp('used_at')->nullable();
            $table->timestamps();

            $table->index('qr_code');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('ticket_categories');
        Schema::dropIfExists('events');
    }
};