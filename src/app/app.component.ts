import { Component, OnInit } from '@angular/core';
import { Task } from './models/task.model';
import { DataHandlerService } from './service/data-handler.service';
import { Category } from './models/category.model';
import {Priority} from './models/priority.model';
import {zip} from 'rxjs';
import {concatMap, map} from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styles: []
})
export class AppComponent implements OnInit {

  // коллекция категорий с кол-вом незавершенных задач для каждой из них
  private categoryMap = new Map<Category, number>();

  private tasks: Task[];
  private categories: Category[]; // все категории
  private priorities: Priority[]; // все приоритеты

  // статистика
  private totalTasksCountInCategory: number;
  private completedCountInCategory: number;
  private uncompletedCountInCategory: number;
  private uncompletedTotalTasksCount: number;

  // показать/скрыть статистику
  private showStat = true;

  // выбранная категория
  private selectedCategory: Category = null;

  // поиск
  private searchTaskText = ''; // текущее значение для поиска задач
  private searchCategoryText = ''; // текущее значение для поиска категорий


  // фильтрация
  private priorityFilter: Priority;
  private statusFilter: boolean;


  constructor(
    private dataHandler: DataHandlerService, // фасад для работы с данными
  ) {
  }

  ngOnInit() {
    this.dataHandler.getAllPriorities().subscribe(priorities => this.priorities = priorities);
    this.dataHandler.getAllCategories().subscribe(categories => this.categories = categories);

    // заполнить меню с категориями
    this.fillCategories();

    this.onSelectCategory(null); // показать все задачи

  }


  // добавление категории
  private onAddCategory(title: string): void {
    this.dataHandler.addCategory(title).subscribe(() => this.fillCategories());
  }

  // private fillCategories(): void {
  //     this.dataHandler.getAllCategories().subscribe(categories => this.categories = categories);
  // }

  // заполняет категории и кол-во невыполненных задач по каждой из них (нужно для отображения категорий)
  private fillCategories() {

    if (this.categoryMap) {
      this.categoryMap.clear();
    }

    this.categories = this.categories.sort((a, b) => a.title.localeCompare(b.title));

    // для каждой категории посчитать кол-во невыполненных задач

    this.categories.forEach(cat => {
      this.dataHandler.getUncompletedCountInCategory(cat).subscribe(count => this.categoryMap.set(cat, count));
    });

  }

  // поиск категории
  private onSearchCategory(title: string): void {

    this.searchCategoryText = title;

    this.dataHandler.searchCategories(title).subscribe(categories => {
      this.categories = categories;
      this.fillCategories();
    });
  }


  // изменение категории
  private onSelectCategory(category: Category): void {

    this.selectedCategory = category;

    this.updateTasksAndStat();

  }

  // // удаление категории
  // private onDeleteCategory(category: Category): void {
  //     this.dataHandler.deleteCategory(category.id).subscribe(cat => {
  //         this.selectedCategory = null; // открываем категорию "Все"
  //         this.onSelectCategory(null);
  //     });
  // }

  // удаление категории
  private onDeleteCategory(category: Category) {
    this.dataHandler.deleteCategory(category.id).subscribe(cat => {
      this.selectedCategory = null; // открываем категорию "Все"
      this.categoryMap.delete(cat); // не забыть удалить категорию из карты
      this.onSearchCategory(this.searchCategoryText);
      this.updateTasks();
    });
  }

  // обновлении категории
  private onUpdateCategory(category: Category): void {
    this.dataHandler.updateCategory(category).subscribe(() => {
      this.onSearchCategory(this.searchCategoryText);
    });
  }

  // обновление задачи
  private onUpdateTask(task: Task): void {

    this.dataHandler.updateTask(task).subscribe(() => {

      this.fillCategories();

      this.updateTasksAndStat();
    });

  }

  // // удаление задачи
  // private onDeleteTask(task: Task): void {
  //
  //     this.dataHandler.deleteTask(task.id).subscribe(cat => {
  //         this.updateTasksAndStat();
  //     });
  // }

  // удаление задачи
  private onDeleteTask(task: Task) {

    this.dataHandler.deleteTask(task.id)
      .pipe(
      concatMap(tsk => { // позволяет выдать несколько обзервебл
          return this.dataHandler.getUncompletedCountInCategory(tsk.category)
      .pipe(map(count => {
            return ({t: tsk, count});
          }));
        }
      )).subscribe(result => {

      const t = result.t as Task;
      if (t.category) {
        this.categoryMap.set(t.category, result.count);
      }

      this.updateTasksAndStat();

    });


  }


  // поиск задач
  private onSearchTasks(searchString: string): void {
    this.searchTaskText = searchString;
    this.updateTasks();
  }

  // фильтрация задач по статусу (все, решенные, нерешенные)
  private onFilterTasksByStatus(status: boolean): void {
    this.statusFilter = status;
    this.updateTasks();
  }

  // фильтрация задач по приоритету
  private onFilterTasksByPriority(priority: Priority): void {
    this.priorityFilter = priority;
    this.updateTasks();
  }

  private updateTasks(): void {
    this.dataHandler.searchTasks(
      this.selectedCategory,
      this.searchTaskText,
      this.statusFilter,
      this.priorityFilter
    ).subscribe((tasks: Task[]) => {
      this.tasks = tasks;
    });
  }


  // // добавление задачи
  // private onAddTask(task: Task): void {
  //
  //     this.dataHandler.addTask(task).subscribe(result => {
  //
  //         this.updateTasksAndStat();
  //
  //     });
  //
  // }

  // добавление задачи
  private onAddTask(task: Task) {


    this.dataHandler.addTask(task)
      .pipe(// сначала добавляем задачу
      concatMap(tsk => { // используем добавленный task (concatMap - для последовательного выполнения)
          // .. и считаем кол-во задач в категории с учетом добавленной задачи
          return this.dataHandler.getUncompletedCountInCategory(tsk.category)
      .pipe(map(count => {
            return ({t: tsk, count}); // в итоге получаем массив с добавленной задачей и кол-вом задач для категории
          }));
        }
      )).subscribe(result => {

      const t = result.t as Task;

      // если указана категория - обновляем счетчик для соотв. категории
      if (t.category) {
        this.categoryMap.set(t.category, result.count);
      }

      this.updateTasksAndStat();

    });

  }



  // показывает задачи с применением всех текущий условий (категория, поиск, фильтры и пр.)
  private updateTasksAndStat(): void {

    this.updateTasks(); // обновить список задач

    // обновить переменные для статистики
    this.updateStat();

  }

  // обновить статистику
  private updateStat(): void {
    zip(
      this.dataHandler.getTotalCountInCategory(this.selectedCategory),
      this.dataHandler.getCompletedCountInCategory(this.selectedCategory),
      this.dataHandler.getUncompletedCountInCategory(this.selectedCategory),
      this.dataHandler.getUncompletedTotalCount())

      .subscribe(array => {
        this.totalTasksCountInCategory = array[0];
        this.completedCountInCategory = array[1];
        this.uncompletedCountInCategory = array[2];
        this.uncompletedTotalTasksCount = array[3]; // нужно для категории Все
      });
  }

  // показать-скрыть статистику
  private toggleStat(showStat: boolean): void {
    this.showStat = showStat;
  }



}
