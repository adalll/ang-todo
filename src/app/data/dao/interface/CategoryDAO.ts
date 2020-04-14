import { Category } from '../../../models/category.model';
import { CommonDAO } from './CommonDAO';
import { Observable } from 'rxjs';

// специфичные методы для работы с категориями (которые не входят в обычный CRUD)
export interface CategoryDAO extends CommonDAO<Category> {

  // поиск категорий по названию
  search(title: string): Observable<Category[]>;

}
