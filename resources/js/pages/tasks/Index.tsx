import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import TaskModal from './TaskModal';
import TaskView from './TaskView';
import { Dialog } from '@/components/ui/dialog';
import TaskFormModal from '@/components/tasks/TaskFormModal';
import TaskPriority from '@/components/tasks/TaskPriority';
import TaskStageChanger from '@/components/tasks/TaskStageChanger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Copy, Trash2, LayoutGrid, List, User as UserIcon, CheckSquare, Columns, AlertTriangle, Clock, UserCheck, UserMinus, ListTodo, Flame } from 'lucide-react';
import { PageTemplate } from '@/components/page-template';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { Task, Project, TaskStage, User, PaginatedData } from '@/types';
import { toast } from '@/components/custom-toast';
import { CrudTable } from '@/components/CrudTable';
import { useTranslation } from 'react-i18next';

interface Props {
    tasks: PaginatedData<Task>;
    projects: Project[];
    stages: TaskStage[];
    members: User[];
    filters: {
        project_id?: string;
        stage_id?: string;
        priority?: string;
        assigned_to?: string;
        search?: string;
        view?: 'kanban' | 'grid' | 'list';
        sort_field?: string;
        sort_direction?: 'asc' | 'desc';
    };
    project_name?: string;
    userWorkspaceRole?: string;
    permissions?: any;
    googleCalendarEnabled?: boolean;
}

export default function TasksIndex({ tasks, projects, stages, members, filters, project_name, userWorkspaceRole, permissions, googleCalendarEnabled }: Props) {
    const { t } = useTranslation();
    const { flash, permissions: pagePermissions } = usePage().props as any;
    const taskPermissions = permissions || pagePermissions;
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedProject, setSelectedProject] = useState(filters.project_id || 'all');
    const [selectedStage, setSelectedStage] = useState(filters.stage_id || 'all');
    const [selectedPriority, setSelectedPriority] = useState(filters.priority || 'all');
    const [selectedAssignee, setSelectedAssignee] = useState(filters.assigned_to || 'all');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [selectedTaskWorkspaceRole, setSelectedTaskWorkspaceRole] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewActiveTab, setViewActiveTab] = useState('details');
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    // Map API view values (grid, list) to local UI state values (card, table)
    const initialViewMode = () => {
        if (filters.view === 'grid') return 'card';
        if (filters.view === 'list') return 'table';
        return filters.view || 'kanban';
    };
    
    const [viewMode, setViewMode] = useState<'card' | 'table' | 'kanban'>(initialViewMode);
    
    // Helper to map UI state back to API-expected view values
    const getApiView = (mode: 'card' | 'table' | 'kanban' = viewMode) => {
        if (mode === 'card') return 'grid';
        if (mode === 'table') return 'list';
        return mode;
    };
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

    // Show flash messages
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // Central param builder — reads per_page/sort from server `filters` prop (source of truth)
    // Pass overrides to replace specific values (e.g. new page, new sort, new view)
    // Pass stateOverrides to replace filter state values before they update via setState
    const buildParams = (
        overrides: Record<string, any> = {},
        stateOverrides: { project?: string; stage?: string; priority?: string; assignee?: string; search?: string; apiView?: string } = {}
    ) => {
        const search   = stateOverrides.search   !== undefined ? stateOverrides.search   : searchTerm;
        const project  = stateOverrides.project  !== undefined ? stateOverrides.project  : selectedProject;
        const stage    = stateOverrides.stage    !== undefined ? stateOverrides.stage    : selectedStage;
        const priority = stateOverrides.priority !== undefined ? stateOverrides.priority : selectedPriority;
        const assignee = stateOverrides.assignee !== undefined ? stateOverrides.assignee : selectedAssignee;
        const apiView  = stateOverrides.apiView  !== undefined ? stateOverrides.apiView  : getApiView();

        const params: any = { page: 1, view: apiView };
        if (search) params.search = search;
        if (project !== 'all') params.project_id = project;
        if (stage !== 'all') params.stage_id = stage;
        if (priority !== 'all') params.priority = priority;
        if (assignee !== 'all') params.assigned_to = assignee;
        if (filters.per_page) params.per_page = filters.per_page;
        if (filters.sort_field) params.sort_field = filters.sort_field;
        if (filters.sort_direction) params.sort_direction = filters.sort_direction;
        if (project_name) params.project_name = project_name;
        return { ...params, ...overrides };
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('tasks.index'), buildParams({ page: 1 }), { preserveState: true, preserveScroll: true });
    };

    const applyFilters = () => {
        router.get(route('tasks.index'), buildParams({ page: 1 }), { preserveState: true, preserveScroll: true });
    };

    const handleFilter = (key: string, value: string) => {
        if (key === 'project_id') setSelectedProject(value);
        if (key === 'stage_id') setSelectedStage(value);
        if (key === 'priority') setSelectedPriority(value);
        if (key === 'assigned_to') setSelectedAssignee(value);

        // Pass new value directly via stateOverrides — don't rely on setState having updated yet
        router.get(route('tasks.index'), buildParams({ page: 1 }, {
            project:  key === 'project_id'  ? value : undefined,
            stage:    key === 'stage_id'    ? value : undefined,
            priority: key === 'priority'    ? value : undefined,
            assignee: key === 'assigned_to' ? value : undefined,
        }), { preserveState: true, preserveScroll: true });
    };

    const handleAction = (action: string, taskOrId: Task | number) => {
        let taskId: number;

        if (typeof taskOrId === 'number') {
            // Called with task ID
            taskId = taskOrId;
        } else {
            // Called with task object from CrudTable
            taskId = taskOrId.id;
        }

        switch (action) {
            case 'view':
                handleViewTask(taskId);
                break;
            case 'edit':
                handleEditTask(taskId);
                break;
            case 'duplicate':
                toast.loading('Duplicating task...');
                router.post(route('tasks.duplicate', taskId), {}, {
                    onSuccess: () => {
                        toast.dismiss();
                    },
                    onError: () => {
                        toast.dismiss();
                        toast.error('Failed to duplicate task');
                    }
                });
                break;
            case 'delete':
                const task = (Array.isArray(tasks) ? tasks : tasks?.data || []).find(t => t.id === taskId);
                if (task) {
                    setTaskToDelete(task);
                    setIsDeleteModalOpen(true);
                }
                break;
        }
    };

    const handleViewTask = async (taskId: number) => {
        try {
            const response = await fetch(route('tasks.show', taskId));
            const data = await response.json();
            setSelectedTask(data.task);
            setSelectedTaskWorkspaceRole(data.workspace_role);
            setViewActiveTab('details');
            setIsViewModalOpen(true);
        } catch (error) {
            console.error('Failed to load task:', error);
        }
    };

    const handleEditTask = async (taskId: number) => {
        try {
            const response = await fetch(route('tasks.show', taskId));
            const data = await response.json();

            const taskWithProject = {
                ...data.task,
                project: projects.find(p => p.id === data.task.project_id) || data.task.project
            };

            setEditingTask(taskWithProject);
            setIsFormModalOpen(true);
        } catch (error) {
            console.error('Failed to load task:', error);
        }
    };

    const hasActiveFilters = () => {
        return selectedProject !== 'all' || selectedStage !== 'all' || selectedPriority !== 'all' || selectedAssignee !== 'all' || searchTerm !== '';
    };

    const activeFilterCount = () => {
        return (selectedProject !== 'all' ? 1 : 0) + (selectedStage !== 'all' ? 1 : 0) + (selectedPriority !== 'all' ? 1 : 0) + (selectedAssignee !== 'all' ? 1 : 0) + (searchTerm ? 1 : 0);
    };

    const handleResetFilters = () => {
        setSelectedProject('all');
        setSelectedStage('all');
        setSelectedPriority('all');
        setSelectedAssignee('all');
        setSearchTerm('');
        setShowFilters(false);
        const params: any = { page: 1, view: getApiView() };
        if (filters.per_page) params.per_page = filters.per_page;
        if (project_name) params.project_name = project_name;
        router.get(route('tasks.index'), params, { preserveState: true, preserveScroll: true });
    };

    const handleDeleteConfirm = () => {
        if (taskToDelete) {
            toast.loading('Deleting task...');
            router.delete(route('tasks.destroy', taskToDelete.id), {
                onSuccess: () => {
                    toast.dismiss();
                    setIsDeleteModalOpen(false);
                    setTaskToDelete(null);
                },
                onError: () => {
                    toast.dismiss();
                    toast.error('Failed to delete task');
                    setIsDeleteModalOpen(false);
                    setTaskToDelete(null);
                }
            });
        }
    };

    const isTaskOverdue = (endDate: string | null) => {
        if (!endDate) return false;
        const today = new Date();
        const dueDate = new Date(endDate);
        return dueDate < today;
    };

    const getPriorityColor = (priority: string) => {
        const colors = {
            low: 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20',
            medium: 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20',
            high: 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20',
            critical: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
        };
        return colors[priority as keyof typeof colors] || 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20';
    };

    const pageActions = [];

    // Only show Create Task button for non-clients
    if (userWorkspaceRole !== 'client') {
        pageActions.push({
            label: t('Create Task'),
            icon: <Plus className="h-4 w-4 mr-2" />,
            variant: 'default',
            onClick: () => {
                setEditingTask(null);
                setIsFormModalOpen(true);
            }
        });
    }

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        ...(project_name ? [{ title: t('Projects'), href: route('projects.index') }] : []),
        { title: project_name ? `${project_name} - ${t('Tasks')}` : t('Tasks') }
    ];

    // Add sorting functionality
    const handleSort = (field: string) => {
        const direction = filters.sort_field === field && filters.sort_direction === 'asc' ? 'desc' : 'asc';
        router.get(route('tasks.index'), buildParams({ sort_field: field, sort_direction: direction, page: 1 }), { preserveState: true, preserveScroll: true });
    };

    // CrudTable configuration
    const columns = [
        {
            key: 'title',
            label: t('Task'),
            sortable: true,
            render: (value: string, row: any) => (
                <div>
                    <div
                        className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => handleAction('view', row.id)}
                    >
                        {value}
                    </div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{row.description}</div>
                </div>
            )
        },
        ...(project_name ? [] : [{
            key: 'project.title',
            label: t('Project'),
            render: (value: string) => value || '-'
        }]),
        {
            key: 'task_stage.name',
            label: t('Stage'),
            render: (value: string, row: any) => (
                <span
                    className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
                    style={{
                        backgroundColor: row.task_stage?.color + '20',
                        color: row.task_stage?.color,
                        boxShadow: `inset 0 0 0 1px ${row.task_stage?.color}33`,
                    }}
                >
                    {row.task_stage?.name}
                </span>
            )
        },
        {
            key: 'priority',
            label: t('Priority'),
            sortable: true,
            render: (value: string) => (
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium capitalize ${getPriorityColor(value)}`}>
                    {value}
                </span>
            )
        },
        {
            key: 'assigned_to',
            label: t('Assignee'),
            render: (value: any) => (
                value ? (
                    <div className="flex items-center">
                        <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={value.avatar} />
                            <AvatarFallback className="text-xs">
                                {value.name?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{value.name}</span>
                    </div>
                ) : (
                    '-'
                )
            )
        },
        {
            key: 'progress',
            label: t('Progress'),
            render: (value: number) => (
                <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{width: `${value}%`}}></div>
                    </div>
                    <span className="text-sm text-gray-900">{value}%</span>
                </div>
            )
        },
        {
            key: 'end_date',
            label: t('Due Date'),
            sortable: true,
            render: (value: string, row: any) => (
                <div className="flex items-center gap-2">
                    {isTaskOverdue(value) ? (
                        <span className='text-red-500'>{value ? window.appSettings.formatDateTime(new Date(value),false) : '-'}</span>
                    ) : (
                        <span>{value ? window.appSettings.formatDateTime(new Date(value),false) : '-'}</span>
                    )}
                </div>
            )
        }
    ];

    const actions = [
        {
            label: t('View'),
            icon: 'Eye',
            action: 'view',
            className: 'text-blue-500 hover:text-blue-700',
            condition: () => true
        },
        {
            label: t('Edit'),
            icon: 'Edit',
            action: 'edit',
            className: 'text-amber-500 hover:text-amber-700',
            condition: () => userWorkspaceRole !== 'client'
        },
        {
            label: t('Duplicate'),
            icon: 'Copy',
            action: 'duplicate',
            className: 'text-green-500 hover:text-green-700',
            condition: () => userWorkspaceRole !== 'client'
        },
        {
            label: t('Delete'),
            icon: 'Trash2',
            action: 'delete',
            className: 'text-red-500 hover:text-red-700',
            condition: () => userWorkspaceRole !== 'client'
        }
    ];

    return (
        <PageTemplate
            title={project_name ? `${project_name} - ${t('Tasks')}` : t('Tasks')}
            url="/tasks"
            actions={pageActions}
            breadcrumbs={breadcrumbs}
            noPadding
        >
            <Head title={t('Tasks')} />

            {/* Overview Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                {/* Total Tasks */}
                <Card className="hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-5 flex items-center space-x-4">
                        <div className="p-3 bg-blue-50 rounded-xl">
                            <ListTodo className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">{t('Total Tasks')}</p>
                            <h3 className="text-xl font-bold text-gray-900">
                                {Array.isArray(tasks) ? tasks.length : (tasks?.total || 0)}
                            </h3>
                        </div>
                    </CardContent>
                </Card>

                {/* Unassigned */}
                <Card className="hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-5 flex items-center space-x-4">
                        <div className="p-3 bg-yellow-50 rounded-xl">
                            <UserMinus className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">{t('Unassigned')}</p>
                            <h3 className="text-xl font-bold text-gray-900">
                                {(Array.isArray(tasks) ? tasks : tasks?.data || []).filter(task => !task.assigned_to).length}
                            </h3>
                        </div>
                    </CardContent>
                </Card>

                {/* Assigned */}
                <Card className="hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-5 flex items-center space-x-4">
                        <div className="p-3 bg-green-50 rounded-xl">
                            <UserCheck className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">{t('Assigned')}</p>
                            <h3 className="text-xl font-bold text-gray-900">
                                {(Array.isArray(tasks) ? tasks : tasks?.data || []).filter(task => task.assigned_to).length}
                            </h3>
                        </div>
                    </CardContent>
                </Card>

                {/* Overdue */}
                <Card className="hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-5 flex items-center space-x-4">
                        <div className="p-3 bg-red-50 rounded-xl">
                            <Clock className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">{t('Overdue')}</p>
                            <h3 className="text-xl font-bold text-gray-900">
                                {(Array.isArray(tasks) ? tasks : tasks?.data || []).filter(task => task.end_date && isTaskOverdue(task.end_date)).length}
                            </h3>
                        </div>
                    </CardContent>
                </Card>

                {/* High Priority */}
                <Card className="hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-5 flex items-center space-x-4">
                        <div className="p-3 bg-orange-50 rounded-xl">
                            <Flame className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">{t('High Priority')}</p>
                            <h3 className="text-xl font-bold text-gray-900">
                                {(Array.isArray(tasks) ? tasks : tasks?.data || []).filter(task => task.priority === 'high' || task.priority === 'critical').length}
                            </h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters Row */}
            <div className="bg-white rounded-lg shadow mb-4">
                <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <form onSubmit={handleSearch} className="flex gap-2">
                                <div className="relative w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={t('Search tasks...')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-9"
                                    />
                                </div>
                                <Button type="submit" size="sm">
                                    <Search className="h-4 w-4 mr-1.5" />
                                    {t('Search')}
                                </Button>
                            </form>

                            <Button
                                variant={hasActiveFilters() ? "default" : "outline"}
                                size="sm"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter className="h-4 w-4 mr-1.5" />
                                {showFilters ? t('Hide Filters') : t('Filters')}
                                {hasActiveFilters() && (
                                    <span className="ml-1 bg-primary-foreground text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                        {activeFilterCount()}
                                    </span>
                                )}
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 border rounded-md p-1">
                                <Button
                                    variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => {
                                        setViewMode('kanban');
                                        router.get(route('tasks.index'), buildParams({ view: 'kanban' }, { apiView: 'kanban' }), { preserveState: true, preserveScroll: true });
                                    }}
                                    className="h-7 px-2"
                                >
                                    <Columns className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={viewMode === 'card' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => {
                                        setViewMode('card');
                                        router.get(route('tasks.index'), buildParams({ page: 1, view: 'grid' }, { apiView: 'grid' }), { preserveState: true, preserveScroll: true });
                                    }}
                                    className="h-7 px-2"
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => {
                                        setViewMode('table');
                                        router.get(route('tasks.index'), buildParams({ page: 1, view: 'list' }, { apiView: 'list' }), { preserveState: true, preserveScroll: true });
                                    }}
                                    className="h-7 px-2"
                                >
                                    <List className="h-4 w-4" />
                                </Button>
                            </div>
                            {viewMode !== 'kanban' && (
                                <>
                                    <Label className="text-xs text-muted-foreground">{t('Per Page')}:</Label>
                                    <Select
                                        value={tasks?.per_page?.toString() || "10"}
                                        onValueChange={(value) => {
                                            router.get(route('tasks.index'), buildParams({ page: 1, per_page: parseInt(value) }), { preserveState: true, preserveScroll: true });
                                        }}
                                    >
                                        <SelectTrigger className="w-16 h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                            <SelectItem value="100">100</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </>
                            )}
                        </div>
                    </div>

                    {showFilters && (
                        <div className="p-4 bg-gray-50 border rounded-md">
                            <div className="flex flex-wrap gap-4 items-end">
                                <div className="space-y-2">
                                    <Label>{t('Project')}</Label>
                                    <Select value={selectedProject} onValueChange={(value) => handleFilter('project_id', value)}>
                                        <SelectTrigger className="w-40">
                                            <SelectValue placeholder={t('All Projects')} />
                                        </SelectTrigger>
                                        <SelectContent searchable>
                                            <SelectItem value="all">{t('All Projects')}</SelectItem>
                                            {projects.map((project) => (
                                                <SelectItem key={project.id} value={project.id.toString()}>
                                                    {project.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>{t('Status')}</Label>
                                    <Select value={selectedStage} onValueChange={(value) => handleFilter('stage_id', value)}>
                                        <SelectTrigger className="w-40">
                                            <SelectValue placeholder="All Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{t('All')}</SelectItem>
                                            {stages.map((stage) => (
                                                <SelectItem key={stage.id} value={stage.id.toString()}>
                                                    {stage.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>{t('Priority')}</Label>
                                    <Select value={selectedPriority} onValueChange={(value) => handleFilter('priority', value)}>
                                        <SelectTrigger className="w-40">
                                            <SelectValue placeholder="All Priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{t('All Priority')}</SelectItem>
                                            <SelectItem value="low">{t('Low')}</SelectItem>
                                            <SelectItem value="medium">{t('Medium')}</SelectItem>
                                            <SelectItem value="high">{t('High')}</SelectItem>
                                            <SelectItem value="critical">{t('Critical')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>{t('Assignee')}</Label>
                                    <Select value={selectedAssignee} onValueChange={(value) => handleFilter('assigned_to', value)}>
                                        <SelectTrigger className="w-40">
                                            <SelectValue placeholder="All Assignees" />
                                        </SelectTrigger>
                                        <SelectContent searchable>
                                            <SelectItem value="all">{t('All Assignees')}</SelectItem>
                                            {members.map((member) => (
                                                <SelectItem key={member.id} value={member.id.toString()}>
                                                    {member.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9"
                                    onClick={handleResetFilters}
                                    disabled={!hasActiveFilters()}
                                >
                                    {t('Reset Filters')}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Tasks Content */}
            <div className="bg-white rounded-lg shadow">
                {viewMode === 'kanban' ? (
                    <div className="bg-gray-50 p-4 rounded-lg" style={{ height: 'calc(100vh - 220px)', overflow: 'hidden' }}>
                        <style>{`
                            .kanban-scroll::-webkit-scrollbar {
                                height: 8px;
                            }
                            .kanban-scroll::-webkit-scrollbar-track {
                                background: #f1f5f9;
                                border-radius: 4px;
                            }
                            .kanban-scroll::-webkit-scrollbar-thumb {
                                background: #cbd5e1;
                                border-radius: 4px;
                            }
                            .kanban-scroll::-webkit-scrollbar-thumb:hover {
                                background: #94a3b8;
                            }
                            .column-scroll::-webkit-scrollbar {
                                width: 6px;
                            }
                            .column-scroll::-webkit-scrollbar-track {
                                background: #f8fafc;
                                border-radius: 3px;
                            }
                            .column-scroll::-webkit-scrollbar-thumb {
                                background: #e2e8f0;
                                border-radius: 3px;
                            }
                            .column-scroll::-webkit-scrollbar-thumb:hover {
                                background: #cbd5e1;
                            }
                            main {
                                overflow: hidden;
                            }
                        `}</style>
                        <div className="flex gap-4 overflow-x-auto pb-4 kanban-scroll" style={{ height: '100%' }}>
                            {stages.map((stage) => {
                                const stageTasks = (Array.isArray(tasks) ? tasks : tasks?.data || []).filter(task => task.task_stage?.id === stage.id);
                                return (
                                    <div
                                        key={stage.id}
                                        className="flex-shrink-0"
                                        style={{ minWidth: '300px', width: '300px' }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            e.currentTarget.classList.remove('bg-blue-50');
                                            const taskId = e.dataTransfer.getData('taskId');
                                            if (taskId) {
                                                toast.loading('Updating task stage...');
                                                router.put(route('tasks.change-stage', taskId), {
                                                    task_stage_id: stage.id
                                                }, {
                                                    onSuccess: () => {
                                                        toast.dismiss();
                                                    },
                                                    onError: () => {
                                                        toast.dismiss();
                                                        toast.error('Failed to update task stage');
                                                    }
                                                });
                                            }
                                        }}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            e.currentTarget.classList.add('bg-blue-50');
                                        }}
                                        onDragLeave={(e) => {
                                            e.currentTarget.classList.remove('bg-blue-50');
                                        }}
                                    >
                                        <div className="bg-gray-100 rounded-lg h-full flex flex-col">
                                            <div className="p-3 border-b border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-semibold text-sm text-gray-700">{stage.name}</h3>
                                                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                                                        {stageTasks.length}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-2 space-y-2 overflow-y-auto flex-1 column-scroll">
                                                {stageTasks.map((task) => (
                                                    <div
                                                        key={task.id}
                                                        draggable
                                                        onDragStart={(e) => {
                                                            e.dataTransfer.setData('taskId', task.id.toString());
                                                            e.currentTarget.classList.add('opacity-50', 'scale-95');
                                                        }}
                                                        onDragEnd={(e) => {
                                                            e.currentTarget.classList.remove('opacity-50', 'scale-95');
                                                        }}
                                                        className="cursor-move transition-all duration-200"
                                                    >
                                                        <Card className="hover:shadow-md transition-all duration-200 border-l-4 hover:scale-105" style={{ borderLeftColor: stage.color }}>
                                                            <CardContent className="p-3">
                                                                <div className="space-y-2">
                                                                    <div className="flex items-start justify-between">
                                                                        <h4
                                                                            className="font-medium text-sm line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer flex-1"
                                                                            onClick={() => handleAction('view', task.id)}
                                                                        >
                                                                            {task.title}
                                                                        </h4>
                                                                        <div className="flex gap-1">
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            handleAction('view', task.id);
                                                                                        }}
                                                                                        className="h-6 w-6 text-blue-500 hover:text-blue-700"
                                                                                    >
                                                                                        <Eye className="h-3 w-3" />
                                                                                    </Button>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>{t('View')}</TooltipContent>
                                                                            </Tooltip>
                                                                            {userWorkspaceRole !== 'client' && (
                                                                                <>
                                                                                    <Tooltip>
                                                                                        <TooltipTrigger asChild>
                                                                                            <Button
                                                                                                variant="ghost"
                                                                                                size="icon"
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    handleAction('edit', task.id);
                                                                                                }}
                                                                                                className="h-6 w-6 text-amber-500 hover:text-amber-700"
                                                                                            >
                                                                                                <Edit className="h-3 w-3" />
                                                                                            </Button>
                                                                                        </TooltipTrigger>
                                                                                        <TooltipContent>{t('Edit')}</TooltipContent>
                                                                                    </Tooltip>
                                                                                    <Tooltip>
                                                                                        <TooltipTrigger asChild>
                                                                                            <Button
                                                                                                variant="ghost"
                                                                                                size="icon"
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    handleAction('delete', task.id);
                                                                                                }}
                                                                                                className="h-6 w-6 text-red-500 hover:text-red-700"
                                                                                            >
                                                                                                <Trash2 className="h-3 w-3" />
                                                                                            </Button>
                                                                                        </TooltipTrigger>
                                                                                        <TooltipContent>{t('Delete')}</TooltipContent>
                                                                                    </Tooltip>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center justify-between">
                                                                        <TaskPriority priority={task.priority} />
                                                                        {task.assigned_to && (
                                                                            <Avatar className="h-5 w-5">
                                                                                <AvatarImage src={task.assigned_to.avatar} />
                                                                                <AvatarFallback className="text-xs">
                                                                                    {task.assigned_to.name?.charAt(0)}
                                                                                </AvatarFallback>
                                                                            </Avatar>
                                                                        )}
                                                                    </div>

                                                                    <div className="space-y-1">
                                                                        <div className="flex justify-between text-xs">
                                                                            <span>{t('Progress')}</span>
                                                                            <span>{task.progress}%</span>
                                                                        </div>
                                                                        <Progress value={task.progress} className="h-1" />
                                                                    </div>

                                                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                                                        {!project_name && (
                                                                            <span className="bg-gray-100 px-2 py-1 rounded text-xs">{task.project?.title}</span>
                                                                        )}
                                                                        <div className="flex items-center gap-2">
                                                                            {isTaskOverdue(task.end_date) ? (
                                                                                <span className='text-red-500'>{task.end_date ? window.appSettings.formatDateTime(new Date(task.end_date),false) : '-'}</span>
                                                                            ) : (
                                                                                <span>{task.end_date ? window.appSettings.formatDateTime(new Date(task.end_date),false) : '-'}</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    </div>
                                                ))}
                                                {stageTasks.length === 0 && (
                                                    <div className="text-center py-8 text-gray-400">
                                                        <CheckSquare className="h-8 w-8 mx-auto mb-2" />
                                                        <p className="text-sm">{t('No tasks')}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : viewMode === 'card' ? (
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {tasks?.data?.map((task: Task) => (
                                <Card key={`card-${task.id}`} className="overflow-hidden hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <CardTitle
                                                className="text-base line-clamp-1 cursor-pointer hover:text-blue-600 transition-colors"
                                                onClick={() => handleAction('view', task.id)}
                                            >
                                                {task.title}
                                            </CardTitle>
                                            <div className="flex gap-1">
                                                <TaskStageChanger
                                                    task={task}
                                                    stages={stages}
                                                    variant="badge"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{task.description || t('No description')}</p>
                                    </CardHeader>

                                    <CardContent className="py-2">
                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span>{t('Progress')}</span>
                                                    <span>{task.progress}%</span>
                                                </div>
                                                <Progress value={task.progress} className="h-1" />
                                            </div>

                                            <div className="flex justify-between items-center text-xs">
                                                <TaskPriority priority={task.priority} />
                                                <div className="flex items-center gap-2">
                                                    {isTaskOverdue(task.end_date) ? (
                                                        <span className='text-red-500'>{task.end_date ? window.appSettings.formatDateTime(new Date(task.end_date),false) : '-'}</span>
                                                    ) : (
                                                        <span>{task.end_date ? window.appSettings.formatDateTime(new Date(task.end_date),false) : '-'}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    {task.assigned_to && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Avatar className="h-6 w-6 cursor-pointer">
                                                                    <AvatarImage src={task.assigned_to.avatar} />
                                                                    <AvatarFallback className="text-xs">
                                                                        {task.assigned_to.name?.charAt(0)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                {task.assigned_to.name}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                </div>

                                                {!project_name && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {task.project?.title}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>

                                    <CardFooter className="flex justify-end gap-1 pt-0 pb-2">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleAction('view', task.id)}
                                                    className="text-blue-500 hover:text-blue-700 h-8 w-8"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>View</TooltipContent>
                                        </Tooltip>
                                        {userWorkspaceRole !== 'client' && (
                                            <>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleAction('edit', task.id)}
                                                            className="text-amber-500 hover:text-amber-700 h-8 w-8"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{t('Edit')}</TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleAction('duplicate', task.id)}
                                                            className="text-green-500 hover:text-green-700 h-8 w-8"
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{t('Duplicate')}</TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleAction('delete', task.id)}
                                                            className="text-red-500 hover:text-red-700 h-8 w-8"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{t('Delete')}</TooltipContent>
                                                </Tooltip>
                                            </>
                                        )}
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                ) : (
                    <CrudTable
                        columns={columns}
                        actions={actions}
                        data={tasks?.data || []}
                        from={tasks?.from || 1}
                        onAction={handleAction}
                        sortField={filters.sort_field}
                        sortDirection={filters.sort_direction}
                        onSort={handleSort}
                        permissions={[]}
                    />
                )}
            </div>

            {/* Empty State */}
            {tasks?.data?.length === 0 && (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold mb-2">{t('No Tasks Found')}</h3>
                    <p className="text-gray-500 mb-4">
                        {hasActiveFilters() ? t('No tasks match your current filters.') : t('No tasks have been created yet.')}
                    </p>
                    {hasActiveFilters() ? (
                        <Button variant="outline" onClick={handleResetFilters}>
                            {t('Clear Filters')}
                        </Button>
                    ) : (
                        <Button onClick={() => {
                            setEditingTask(null);
                            setIsFormModalOpen(true);
                        }}>
                            <Plus className="h-4 w-4 mr-2" />
                            {t('Create your first task')}
                        </Button>
                    )}
                </div>
            )}

            {/* Pagination - Hidden in Kanban view */}
            {tasks?.links && viewMode !== 'kanban' && !Array.isArray(tasks) && (
                <div className="mt-6 bg-white p-4 rounded-lg shadow flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        {t('Showing')} <span className="font-medium">{tasks?.from || 0}</span> {t('to')} <span className="font-medium">{tasks?.to || 0}</span> {t('of')} <span className="font-medium">{tasks?.total || 0}</span> {t('tasks')}
                    </div>

                    <div className="flex gap-1">
                        {tasks?.links?.map((link: any, i: number) => {
                            const isTextLink = link.label === "&laquo; Previous" || link.label === "Next &raquo;";
                            const label = link.label.replace("&laquo; ", "").replace(" &raquo;", "");

                            return (
                                <Button
                                    key={i}
                                    variant={link.active ? 'default' : 'outline'}
                                    size={isTextLink ? "sm" : "icon"}
                                    className={isTextLink ? "px-3" : "h-8 w-8"}
                                    disabled={!link.url}
                                    onClick={() => {
                                        if (!link.url) return;
                                        const pageNum = new URL(link.url).searchParams.get('page');
                                        router.get(route('tasks.index'), buildParams({ page: pageNum ? parseInt(pageNum) : 1 }), { preserveState: true, preserveScroll: true });
                                    }}
                                >
                                    {isTextLink ? label : <span dangerouslySetInnerHTML={{ __html: link.label }} />}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Modals */}
            {/* View Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={(open) => { setIsViewModalOpen(open); if (!open) setSelectedTask(null); }}>
                {selectedTask && (
                    <TaskView
                        task={selectedTask}
                        activeTab={viewActiveTab}
                        onTabChange={setViewActiveTab}
                        members={members}
                        workspaceRole={selectedTaskWorkspaceRole}
                        onUpdate={async () => {
                            const response = await fetch(route('tasks.show', selectedTask.id));
                            const data = await response.json();
                            setSelectedTask(data.task);
                        }}
                    />
                )}
            </Dialog>

            {/* Edit Modal */}
            {selectedTask && (
                <TaskModal
                    task={selectedTask}
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedTask(null);
                    }}
                    members={members}
                    stages={stages}
                    milestones={selectedTask.project?.milestones || []}
                    permissions={taskPermissions}
                    workspaceRole={selectedTaskWorkspaceRole}
                    mode="view"
                />
            )}

            <TaskFormModal
                isOpen={isFormModalOpen}
                onClose={() => {
                    setIsFormModalOpen(false);
                    setEditingTask(null);
                }}
                task={editingTask || undefined}
                projects={projects}
                members={members}
                milestones={editingTask?.project?.milestones || []}
                googleCalendarEnabled={googleCalendarEnabled}
            />

            {/* Delete Modal */}
            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setTaskToDelete(null);
                }}
                onConfirm={handleDeleteConfirm}
                itemName={taskToDelete?.title || ''}
                entityName={t('task')}
            />
        </PageTemplate>
    );
}
