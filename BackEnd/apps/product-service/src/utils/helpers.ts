import { ReviewNode } from 'libs/utils/interface';
import { Review } from '../modules/reviews/entites/reviews.entity';
import { SelectQueryBuilder } from 'typeorm';
import { ProductVariant } from '../modules/products/entities/product-variant.entity';
import { GetMinMaxPriceDto } from 'libs/dtos/product/create-product.dto';

export const generateSku = (
  category: string,
  productName: string,
  attributes: Record<string, string>,
) => {
  const categoryCode = category === 'Storage' ? 'SSD' : category.toUpperCase();

  const words = productName.toUpperCase().split(' ');

  const importantParts = words.filter((w) => /[0-9]/.test(w) || w.length >= 5);

  let productCode =
    importantParts.join('').replace(/[^A-Z0-9]/g, '') ||
    productName
      .replace(/[^A-Z0-9]/gi, '')
      .toUpperCase()
      .slice(0, 10);

  productCode = productCode.slice(0, 12);

  let attrCode = Object.keys(attributes)
    .sort()
    .slice(0, 2)
    .map((k) => attributes[k])
    .join('-')
    .toUpperCase()
    .replace('BOXED', 'BOX')
    .replace(/[^A-Z0-9\-]/g, '');

  return `${categoryCode}-${productCode}-${attrCode}`;
};

export function buildReviewTreeSafe(reviews: Review[]): ReviewNode[] {
  const map = new Map<string, ReviewNode>();
  const roots: ReviewNode[] = [];

  for (const r of reviews) {
    map.set(r.id, {
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      userId: r.userId,
      variantId: r.variantId,
      parentId: r.parentId ?? null,
      depth: r.depth,
      createdAt: r.createdAt,
      children: [],
    });
  }

  for (const node of map.values()) {
    if (!node.parentId || !map.has(node.parentId)) {
      roots.push(node);
      continue;
    }
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortTree = (nodes: ReviewNode[], depth = 0) => {
    nodes.sort((a, b) => {
      if (depth === 0) {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    nodes.forEach((n) => sortTree(n.children, depth + 1));
  };

  sortTree(roots);

  return roots;
}

export function applyVariantFilters(
  qb: SelectQueryBuilder<ProductVariant>,
  dto: GetMinMaxPriceDto,
) {
  const {
    categoryIds,
    brands,
    createdBy,
    updatedBy,
    createdAtOperators,
    updatedAtOperators,
    priceOperators,
    dueDateOperators,
    names,
    search,
    nameRegex,
    categories,
    isQueryBrand,
  } = dto;
  const keyword = search ? `%${search}%` : undefined;

  if (categoryIds?.length) {
    qb.andWhere('product.categoryId IN (:...categoryIds)', {
      categoryIds,
    });
  }

  if (isQueryBrand && brands?.length) {
    qb.andWhere('product.brand IN (:...brands)', {
      brands,
    });
  }

  if (createdBy?.length) {
    qb.andWhere('product.createdBy IN (:...createdBy)', {
      createdBy,
    });
  }

  if (updatedBy?.length) {
    qb.andWhere('product.updatedBy IN (:...updatedBy)', {
      updatedBy,
    });
  }

  if (names?.length) {
    qb.andWhere('product.name IN (:...names)', {
      names,
    });
  }

  if (categories?.length) {
    if (categories.length === 1) {
      qb.andWhere('category.name LIKE :category', {
        category: `%${categories[0]}%`,
      });
    } else if (categories.length > 1) {
      qb.andWhere('category.name IN (:...categories)', {
        categories,
      });
    }
  }

  if (createdAtOperators?.length) {
    createdAtOperators.forEach((p, index) => {
      qb.andWhere(`DATE(variant.createdAt) ${p.operator} :createdAt${index}`, {
        [`createdAt${index}`]: p.value,
      });
    });
  }

  if (updatedAtOperators?.length) {
    updatedAtOperators.forEach((p, index) => {
      qb.andWhere(`DATE(variant.updatedAt) ${p.operator} :updatedAt${index}`, {
        [`updatedAt${index}`]: p.value,
      });
    });
  }

  if (dueDateOperators?.length) {
    dueDateOperators.forEach((p, index) => {
      qb.andWhere(`DATE(variant.dueDate) ${p.operator} :dueDate${index}`, {
        [`dueDate${index}`]: p.value,
      });
    });
  }

  if (priceOperators?.length) {
    priceOperators.forEach((p, index) => {
      qb.andWhere(
        `variant.price * (1 - COALESCE(variant.discount, 0) / 100) ${p.operator} :price${index}`,
        {
          [`price${index}`]: p.value,
        },
      );
    });
  }

  if (search?.length) {
    qb.andWhere(
      `(
        product.name LIKE :keyword 
        OR variant.sku LIKE :keyword
        OR LOWER(JSON_UNQUOTE(JSON_EXTRACT(variant.attributes, '$'))) LIKE LOWER(:keyword)
      )`,
      { keyword },
    );
  }

  if (nameRegex?.length) {
    const keyword = nameRegex.match(/^\/(.*)\/i$/)[1];
    qb.andWhere('product.name LIKE :nameRegex', {
      nameRegex: `%${keyword}%`,
    });
  }

  return qb;
}
