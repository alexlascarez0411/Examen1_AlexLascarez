<?php

namespace App\Services;

use App\Exceptions\ReglaNegocioException;
use App\Models\Equipo;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EquipoService
{
    /**
     * Listado paginado con la categoría cargada de forma anticipada (sin N+1),
     * ordenado por código. Filtros opcionales:
     *  - $q:      busca en código o nombre (coincidencia parcial)
     *  - $estado: filtra por estado exacto
     */
    public function listar(?string $q, ?string $estado, int $porPagina): LengthAwarePaginator
    {
        return Equipo::with('categoria')
            ->when($q, function ($query, $q) {
                $query->where(function ($subQuery) use ($q) {
                    $subQuery->where('codigo', 'like', "%{$q}%")
                             ->orWhere('nombre', 'like', "%{$q}%");
                });
            })
            ->when($estado, function ($query, $estado) {
                $query->where('estado', $estado);
            })
            ->orderBy('codigo')
            ->paginate($porPagina);
    }

    public function crear(array $datos): Equipo
    {
        $equipo = Equipo::create($datos);

        return $equipo->load('categoria');
    }

    public function actualizar(Equipo $equipo, array $datos): Equipo
    {
        $equipo->update($datos);

        return $equipo->load('categoria');
    }

    public function eliminar(Equipo $equipo): void
    {
        if ($equipo->estado === 'prestado') {
            throw new ReglaNegocioException('No se puede eliminar un equipo prestado.');
        }

        $equipo->delete();
    }

    public function prestar(Equipo $equipo): Equipo
    {
        if ($equipo->estado === 'mantenimiento') {
            throw new ReglaNegocioException('No se puede prestar un equipo en mantenimiento.');
        }

        if ($equipo->estado === 'prestado') {
            throw new ReglaNegocioException('El equipo ya se encuentra prestado.');
        }

        $equipo->update(['estado' => 'prestado']);

        return $equipo->load('categoria');
    }
}