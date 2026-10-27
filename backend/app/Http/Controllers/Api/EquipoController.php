<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\GuardarEquipoRequest;
use App\Http\Resources\EquipoResource;
use App\Models\Equipo;
use App\Services\EquipoService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class EquipoController extends Controller
{
    public function __construct(private EquipoService $service)
    {
    }

    public function index(Request $request)
    {
        $perPage = (int) $request->input('per_page', 10);
        if ($perPage < 1) {
            $perPage = 10;
        }
        $perPage = min($perPage, 50);

        $equipos = $this->service->listar(
            $request->input('q'),
            $request->input('estado'),
            $perPage
        );

        return EquipoResource::collection($equipos);
    }

    public function show(Equipo $equipo)
    {
        return new EquipoResource($equipo->loadMissing('categoria'));
    }

    public function store(GuardarEquipoRequest $request)
    {
        $equipo = $this->service->crear($request->validated());

        return (new EquipoResource($equipo))
            ->response()
            ->header('Location', url("/api/equipos/{$equipo->id}"))
            ->setStatusCode(201);
    }

    public function update(GuardarEquipoRequest $request, Equipo $equipo)
    {
        $equipoActualizado = $this->service->actualizar($equipo, $request->validated());

        return new EquipoResource($equipoActualizado);
    }

    public function destroy(Equipo $equipo): Response
    {
        $this->service->eliminar($equipo);

        return response()->noContent();
    }

    public function prestar(Equipo $equipo)
    {
        $equipoPrestado = $this->service->prestar($equipo);

        return new EquipoResource($equipoPrestado);
    }
}