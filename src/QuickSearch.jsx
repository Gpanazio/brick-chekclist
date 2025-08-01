import React from 'react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from '@/components/ui/command.jsx'
import { Badge } from '@/components/ui/badge.jsx'

function QuickSearch({ open, onOpenChange, equipamentos, onSelect }) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar equipamento..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado.</CommandEmpty>
        <CommandGroup heading="Equipamentos">
          {equipamentos.map((eq) => (
            <CommandItem key={eq.id} value={eq.descricao} onSelect={() => onSelect(eq.id)}>
              <span>{eq.descricao}</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                {eq.categoria}
              </Badge>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

export default QuickSearch
