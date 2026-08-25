import React from 'react';
import {
  Laptop,
  Monitor,
  Camera,
  Projector,
  Mic,
  Speaker,
  Headphones,
  Keyboard,
  Mouse,
  Tablet,
  Printer,
  Wifi,
  HardDrive,
  BatteryCharging,
  Zap,
  Lightbulb,
  Gamepad2,
  Tv,
  Box,
  Radio,
  Sliders,
  Glasses,
  Video,
} from 'lucide-react';

export function getEquipmentIcon(name: string = ''): React.ReactNode {
  const n = name.toLowerCase();

  if (n.includes('laptop') || n.includes('macbook') || n.includes('notebook')) {
    return <Laptop className="w-5 h-5" />;
  }
  if (n.includes('monitor') || n.includes('screen') || n.includes('desktop') || n.includes('optiplex') || n.includes('elitedesk')) {
    return <Monitor className="w-5 h-5" />;
  }
  if (n.includes('camera') || n.includes('dslr') || n.includes('lens') || n.includes('gopro')) {
    return <Camera className="w-5 h-5" />;
  }
  if (n.includes('projector')) {
    return <Projector className="w-5 h-5" />;
  }
  if (n.includes('microphone') || n.includes('mic')) {
    return <Mic className="w-5 h-5" />;
  }
  if (n.includes('speaker') || n.includes('jbl') || n.includes('bose') || n.includes('sound')) {
    return <Speaker className="w-5 h-5" />;
  }
  if (n.includes('headphone') || n.includes('headset') || n.includes('audio-technica')) {
    return <Headphones className="w-5 h-5" />;
  }
  if (n.includes('keyboard')) {
    return <Keyboard className="w-5 h-5" />;
  }
  if (n.includes('mouse')) {
    return <Mouse className="w-5 h-5" />;
  }
  if (n.includes('tablet') || n.includes('ipad') || n.includes('galaxy tab')) {
    return <Tablet className="w-5 h-5" />;
  }
  if (n.includes('printer') || n.includes('scanner')) {
    return <Printer className="w-5 h-5" />;
  }
  if (n.includes('router') || n.includes('switch') || n.includes('network') || n.includes('wifi')) {
    return <Wifi className="w-5 h-5" />;
  }
  if (n.includes('storage') || n.includes('ssd') || n.includes('hard drive') || n.includes('disk')) {
    return <HardDrive className="w-5 h-5" />;
  }
  if (n.includes('power bank') || n.includes('battery')) {
    return <BatteryCharging className="w-5 h-5" />;
  }
  if (n.includes('ups') || n.includes('surge') || n.includes('power strip') || n.includes('extension')) {
    return <Zap className="w-5 h-5" />;
  }
  if (n.includes('light') || n.includes('softbox') || n.includes('ring light')) {
    return <Lightbulb className="w-5 h-5" />;
  }
  if (n.includes('vr') || n.includes('meta')) {
    return <Glasses className="w-5 h-5" />;
  }
  if (n.includes('console') || n.includes('playstation') || n.includes('xbox')) {
    return <Gamepad2 className="w-5 h-5" />;
  }
  if (n.includes('mixer') || n.includes('interface') || n.includes('recorder')) {
    return <Sliders className="w-5 h-5" />;
  }
  if (n.includes('drone') || n.includes('gimbal') || n.includes('streaming') || n.includes('capture')) {
    return <Video className="w-5 h-5" />;
  }
  if (n.includes('radio') || n.includes('clicker')) {
    return <Radio className="w-5 h-5" />;
  }
  if (n.includes('tv') || n.includes('teleprompter')) {
    return <Tv className="w-5 h-5" />;
  }

  return <Box className="w-5 h-5" />;
}
