import { Priority } from '../../../models/priority.model';
import { CommonDAO } from './CommonDAO';

// специфичные методы для работы приоритетами (которые не входят в обычный CRUD)
export interface PriorityDAO extends CommonDAO<Priority> {

  // здесь будут специфичные методы для работы с категориями (на будущее)

}
