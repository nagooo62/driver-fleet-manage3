import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';

interface Driver {
  id: string;
  fullName: string;
  iqama: string;
  iqamaExpiry: Date;
  licenseExpiry: Date;
  status: string;
  manager: string;
  app?: string;
  accepted: boolean;
  sponsored: boolean;
  ajer: boolean;
  archived: boolean;
  createdAt: Date;
}

interface Car {
  plate: string;
  type: string;
  status: string;
  delegateId?: string;
  delegationStart?: Date;
  delegationEnd?: Date;
  history: string[];
}

interface ChartsProps {
  drivers: Driver[];
  cars: Car[];
}

export const Charts = ({ drivers, cars }: ChartsProps) => {
  // Driver status data
  const driverStatusData = [
    { name: 'نشط', value: drivers.filter(d => d.status === 'نشط').length, color: '#22c55e' },
    { name: 'مجمد', value: drivers.filter(d => d.status === 'مجمد').length, color: '#f59e0b' },
    { name: 'متوقف', value: drivers.filter(d => d.status === 'متوقف').length, color: '#ef4444' }
  ];

  // Car status data
  const carStatusData = [
    { name: 'مفوضة', value: cars.filter(c => c.status === 'مفوضة').length, fill: '#22c55e' },
    { name: 'مسلمة', value: cars.filter(c => c.status === 'مسلمة').length, fill: '#3b82f6' },
    { name: 'خارج الخدمة', value: cars.filter(c => c.status === 'خارج الخدمة').length, fill: '#ef4444' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Driver Status Pie Chart */}
      <div className="glass rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">توزيع حالات المناديب</h3>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={driverStatusData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
            >
              {driverStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              labelStyle={{ color: '#1f2937' }}
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                border: 'none',
                borderRadius: '8px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Car Status Bar Chart */}
      <div className="glass rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">حالات السيارات</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={carStatusData}>
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12, fill: '#e2e8f0' }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
              tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#e2e8f0' }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
              tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
            />
            <Tooltip 
              labelStyle={{ color: '#1f2937' }}
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                border: 'none',
                borderRadius: '8px'
              }}
            />
            <Bar 
              dataKey="value" 
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};