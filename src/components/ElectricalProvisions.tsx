import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Label } from './ui/label'
import { Trash, Plus, Lightning, Info } from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  ElectricalRoom,
  ElectricalProvisions,
  SwitchesBrand,
  WiresBrand,
  DEFAULT_ROOMS,
  SWITCHES_BRANDS,
  WIRES_BRANDS,
} from '@/lib/types'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'

export function ElectricalProvisionsComponent() {
  const [provisions, setProvisions] = useKV<ElectricalProvisions>('electrical-provisions', {
    rooms: DEFAULT_ROOMS,
    inverterWiring: true,
    switchesBrand: 'anchor_roma',
    wiresBrand: 'finolex',
  })

  const handleRoomUpdate = (roomId: string, field: keyof ElectricalRoom, value: number | boolean | string) => {
    if (!provisions) return
    setProvisions({
      ...provisions,
      rooms: provisions.rooms.map((room) =>
        room.roomId === roomId ? { ...room, [field]: value } : room
      ),
    })
  }

  const handleAddRoom = () => {
    if (!provisions) return
    const newRoomId = `custom_${Date.now()}`
    setProvisions({
      ...provisions,
      rooms: [
        ...provisions.rooms,
        {
          roomId: newRoomId,
          name: 'New Room',
          lights: 1,
          fans: 1,
          socket5A: 1,
          socket15A: 0,
          acProvision: false,
          tvPoint: false,
        },
      ],
    })
    toast.success('New room added')
  }

  const handleRemoveRoom = (roomId: string) => {
    if (!provisions) return
    setProvisions({
      ...provisions,
      rooms: provisions.rooms.filter((room) => room.roomId !== roomId),
    })
    toast.success('Room removed')
  }

  const calculateTotalPoints = () => {
    if (!provisions) return 0
    return provisions.rooms.reduce((total, room) => {
      return (
        total +
        room.lights +
        room.fans +
        room.socket5A +
        room.socket15A +
        (room.acProvision ? 1 : 0) +
        (room.tvPoint ? 1 : 0)
      )
    }, 0)
  }

  const calculateEstimatedCost = (sqft: number = 1000) => {
    if (!provisions) return 0
    const basePointCost = calculateTotalPoints() * 150
    const switchesBrand = SWITCHES_BRANDS.find((b) => b.value === provisions.switchesBrand)
    const wiresBrand = WIRES_BRANDS.find((b) => b.value === provisions.wiresBrand)
    const brandCostAdjustment =
      (switchesBrand?.costPerSqFt || 0) + (wiresBrand?.costPerSqFt || 0)
    const totalCost = basePointCost + brandCostAdjustment * sqft
    return totalCost
  }

  if (!provisions) return null

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Lightning className="text-primary" size={28} weight="fill" />
          <h1 className="text-3xl font-bold text-gray-900">Electrical Provisions</h1>
        </div>
        <p className="text-gray-600">Configure room-by-room electrical requirements</p>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info size={20} className="text-primary" />
            Configuration Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="switches-brand">Switches Brand</Label>
              <Select
                value={provisions.switchesBrand}
                onValueChange={(value: SwitchesBrand) => {
                  if (!provisions) return
                  setProvisions({ ...provisions, switchesBrand: value })
                }}
              >
                <SelectTrigger id="switches-brand">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SWITCHES_BRANDS.map((brand) => (
                    <SelectItem key={brand.value} value={brand.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{brand.label}</span>
                        {brand.costPerSqFt > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            +₹{brand.costPerSqFt}/sq.ft
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wires-brand">Wires Brand</Label>
              <Select
                value={provisions.wiresBrand}
                onValueChange={(value: WiresBrand) => {
                  if (!provisions) return
                  setProvisions({ ...provisions, wiresBrand: value })
                }}
              >
                <SelectTrigger id="wires-brand">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WIRES_BRANDS.map((brand) => (
                    <SelectItem key={brand.value} value={brand.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{brand.label}</span>
                        {brand.costPerSqFt > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            +₹{brand.costPerSqFt}/sq.ft
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="flex items-start gap-3">
            <Checkbox
              id="inverter-wiring"
              checked={provisions.inverterWiring}
              onCheckedChange={(checked) => {
                if (!provisions) return
                setProvisions({ ...provisions, inverterWiring: checked as boolean })
              }}
            />
            <div className="space-y-1">
              <Label htmlFor="inverter-wiring" className="cursor-pointer font-medium">
                Include inverter line for light + fan in each room and light in toilets
              </Label>
              <p className="text-sm text-muted-foreground">
                Ensures essential circuits continue during power outages
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Room Electrical Configuration</CardTitle>
              <CardDescription>Customize electrical points for each room</CardDescription>
            </div>
            <Button onClick={handleAddRoom} size="sm" className="gap-2">
              <Plus size={16} weight="bold" />
              Add Room
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left p-3 font-semibold text-gray-900 min-w-[150px]">Room</th>
                  <th className="text-center p-3 font-semibold text-gray-900 min-w-[80px]">Lights</th>
                  <th className="text-center p-3 font-semibold text-gray-900 min-w-[80px]">Fans</th>
                  <th className="text-center p-3 font-semibold text-gray-900 min-w-[100px]">
                    5A Sockets
                  </th>
                  <th className="text-center p-3 font-semibold text-gray-900 min-w-[100px]">
                    15A Sockets
                  </th>
                  <th className="text-center p-3 font-semibold text-gray-900 min-w-[120px]">
                    AC Provision
                  </th>
                  <th className="text-center p-3 font-semibold text-gray-900 min-w-[100px]">
                    TV Point
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-900 min-w-[200px]">Other</th>
                  <th className="text-center p-3 font-semibold text-gray-900 min-w-[80px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {provisions.rooms.map((room) => (
                  <tr key={room.roomId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3">
                      <Input
                        value={room.name}
                        onChange={(e) =>
                          handleRoomUpdate(room.roomId, 'name', e.target.value)
                        }
                        className="font-medium"
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        min="0"
                        value={room.lights}
                        onChange={(e) =>
                          handleRoomUpdate(room.roomId, 'lights', parseInt(e.target.value) || 0)
                        }
                        className="text-center"
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        min="0"
                        value={room.fans}
                        onChange={(e) =>
                          handleRoomUpdate(room.roomId, 'fans', parseInt(e.target.value) || 0)
                        }
                        className="text-center"
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        min="0"
                        value={room.socket5A}
                        onChange={(e) =>
                          handleRoomUpdate(room.roomId, 'socket5A', parseInt(e.target.value) || 0)
                        }
                        className="text-center"
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        min="0"
                        value={room.socket15A}
                        onChange={(e) =>
                          handleRoomUpdate(room.roomId, 'socket15A', parseInt(e.target.value) || 0)
                        }
                        className="text-center"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={room.acProvision}
                          onCheckedChange={(checked) =>
                            handleRoomUpdate(room.roomId, 'acProvision', checked as boolean)
                          }
                        />
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={room.tvPoint}
                          onCheckedChange={(checked) =>
                            handleRoomUpdate(room.roomId, 'tvPoint', checked as boolean)
                          }
                        />
                      </div>
                    </td>
                    <td className="p-3">
                      <Input
                        value={room.other || ''}
                        onChange={(e) =>
                          handleRoomUpdate(room.roomId, 'other', e.target.value)
                        }
                        placeholder="Additional provisions..."
                        className="text-sm"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRoom(room.roomId)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/30">
        <CardHeader>
          <CardTitle className="text-primary">Cost Estimate</CardTitle>
          <CardDescription>Based on current configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Total Electrical Points</p>
              <p className="text-3xl font-bold text-gray-900">{calculateTotalPoints()}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Brand Selection</p>
              <p className="text-lg font-semibold text-gray-900">
                {SWITCHES_BRANDS.find((b) => b.value === provisions.switchesBrand)?.label.split(
                  ' ('
                )[0] || '-'}
              </p>
              <p className="text-sm text-gray-600">
                {WIRES_BRANDS.find((b) => b.value === provisions.wiresBrand)?.label.split(' (')[0] ||
                  '-'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-primary/50">
              <p className="text-sm text-gray-600 mb-1">Estimated Cost (1000 sq.ft)</p>
              <p className="text-3xl font-bold text-primary">
                ₹{calculateEstimatedCost(1000).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ~₹{(calculateEstimatedCost(1000) / 1000).toFixed(2)}/sq.ft
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-600 bg-white rounded-lg p-4 border border-gray-200">
            <p className="font-medium mb-2">Cost Breakdown:</p>
            <ul className="space-y-1">
              <li>• Base point cost: ₹{(calculateTotalPoints() * 150).toLocaleString('en-IN')}</li>
              <li>
                • Switches brand premium:{' '}
                {SWITCHES_BRANDS.find((b) => b.value === provisions.switchesBrand)?.costPerSqFt ||
                  0}{' '}
                ₹/sq.ft
              </li>
              <li>
                • Wires brand premium:{' '}
                {WIRES_BRANDS.find((b) => b.value === provisions.wiresBrand)?.costPerSqFt || 0}{' '}
                ₹/sq.ft
              </li>
              {provisions.inverterWiring && <li>• Inverter wiring included</li>}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
