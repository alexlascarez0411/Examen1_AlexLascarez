<?php

use App\Models\Categoria;
use App\Models\Equipo;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    Sanctum::actingAs(User::factory()->create());
});

it('crea un equipo y responde 201 con el encabezado Location', function () {
    $categoria = Categoria::first() ?? Categoria::factory()->create();

    $datos = [
        'codigo' => 'EQ-9999',
        'nombre' => 'Proyector Epson',
        'categoria_id' => $categoria->id,
        'estado' => 'disponible',
        'fecha_adquisicion' => now()->format('Y-m-d'),
        'costo_interno' => 450.00,
    ];

    $response = $this->postJson('/api/equipos', $datos);

    $response->assertStatus(201)
        ->assertHeader('Location')
        ->assertJsonPath('data.codigo', 'EQ-9999');

    $this->assertDatabaseHas('equipos', [
        'codigo' => 'EQ-9999',
    ]);
});

it('rechaza un equipo con datos inválidos y responde 422 con errores por campo', function () {
    $response = $this->postJson('/api/equipos', [
        'codigo' => 'Codigo-INVALIDO',
        'nombre' => 'No',
        'categoria_id' => 999999,
        'fecha_adquisicion' => now()->addYear()->format('Y-m-d'),
        'costo_interno' => -50,
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors([
            'codigo',
            'nombre',
            'categoria_id',
            'fecha_adquisicion',
            'costo_interno',
        ]);
});

it('impide eliminar un equipo prestado y responde 409', function () {
    $categoria = Categoria::first() ?? Categoria::factory()->create();

    $equipo = Equipo::factory()->create([
        'estado' => 'prestado',
        'categoria_id' => $categoria->id,
    ]);

    $response = $this->deleteJson("/api/equipos/{$equipo->id}");

    $response->assertStatus(409)
        ->assertJson([
            'mensaje' => 'No se puede eliminar un equipo prestado.',
            'codigo' => 'REGLA_NEGOCIO',
        ]);

    $this->assertDatabaseHas('equipos', [
        'id' => $equipo->id,
    ]);
});
