import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { useTranslation } from 'react-i18next';

interface BudgetProgressProps {
    budget: {
        total_budget: number;
        total_spent: number;
        remaining_budget: number;
        utilization_percentage: number;
        currency: string;
        categories: Array<{
            id: number;
            name: string;
            allocated_amount: number;
            total_spent: number;
            utilization_percentage: number;
            color: string;
            description?: string;
        }>;
    };
}

export default function BudgetProgress({ budget }: BudgetProgressProps) {
    const { t } = useTranslation();

    const getUtilizationColor = (pct: number) => {
        if (pct >= 90) return 'text-red-600';
        if (pct >= 75) return 'text-yellow-600';
        return 'text-green-600';
    };

    const getBarColor = (pct: number, categoryColor: string) => {
        if (pct >= 90) return '#ef4444';
        if (pct >= 75) return '#f59e0b';
        return categoryColor;
    };

    if (!budget.categories?.length) return null;

    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base font-semibold">{t('Budget Categories')}</CardTitle>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('Track spending across different categories')}</p>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{budget.categories.length} {t('categories')}</span>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {budget.categories.map((category) => {
                        const pct = category.utilization_percentage || 0;
                        const remaining = (category.allocated_amount || 0) - (category.total_spent || 0);
                        const isOver = pct > 100;
                        const barColor = getBarColor(pct, category.color);

                        return (
                            <div key={category.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span
                                            className="h-3 w-3 rounded-sm shrink-0"
                                            style={{ backgroundColor: category.color }}
                                        />
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{category.name}</p>
                                            {category.description && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{category.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-4">
                                        <span className={`text-sm font-bold ${getUtilizationColor(pct)}`}>{pct.toFixed(1)}%</span>
                                        {isOver ? (
                                            <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20">
                                                <TrendingUp className="h-3 w-3" />{t('Over budget')}
                                            </span>
                                        ) : pct >= 75 ? (
                                            <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
                                                <AlertTriangle className="h-3 w-3" />{t('High usage')}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
                                                <TrendingDown className="h-3 w-3" />{t('On track')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-3">
                                    <div
                                        className="h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }}
                                    />
                                </div>

                                {/* Amounts */}
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(category.allocated_amount || 0)}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('Allocated')}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">{formatCurrency(category.total_spent || 0)}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('Spent')}</p>
                                    </div>
                                    <div>
                                        <p className={`text-xs font-semibold ${remaining < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                            {formatCurrency(remaining)}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('Remaining')}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
