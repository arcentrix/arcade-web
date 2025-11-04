/**
 * Models 页面 - 展示所有子菜单卡片
 */

import { Link } from 'react-router-dom';
import {
  Bot,
  ChevronRight,
  Rabbit,
  Bird,
  Turtle,
} from 'lucide-react';

const modelsItems = [
  {
    title: 'Genesis',
    url: '/models/genesis',
    description: 'Our fastest model for general use cases',
    icon: Rabbit,
    color: 'text-green-500',
  },
  {
    title: 'Explorer',
    url: '/models/explorer',
    description: 'Performance and speed for efficiency',
    icon: Bird,
    color: 'text-blue-500',
  },
  {
    title: 'Quantum',
    url: '/models/quantum',
    description: 'The most powerful model for complex computations',
    icon: Turtle,
    color: 'text-purple-500',
  },
];

export default function ModelsPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Bot className="h-8 w-8" />
            Models
          </h2>
          <p className="text-muted-foreground mt-1">
            Choose the right AI model for your use case
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {modelsItems.map((item) => (
          <Link key={item.url} to={item.url} className="group">
            <div className="h-full rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-primary/50 cursor-pointer">
              <div className="flex items-start gap-4">
                <div className={`shrink-0 ${item.color}`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-foreground mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

