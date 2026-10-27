<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EquipoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'codigo' => $this->codigo,
            'nombre' => $this->nombre,
            'estado' => $this->estado,
            'fecha_adquisicion' => $this->fecha_adquisicion instanceof \Carbon\Carbon
                ? $this->fecha_adquisicion->format('Y-m-d')
                : substr((string) $this->fecha_adquisicion, 0, 10),
            'categoria' => new CategoriaResource($this->whenLoaded('categoria')),
        ];
    }
}