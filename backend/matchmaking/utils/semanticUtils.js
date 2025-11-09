const EPSILON = 1e-9;

const dotProduct = (a = [], b = []) => {
  const length = Math.min(a.length, b.length);
  if (!length) return 0;
  let sum = 0;
  for (let index = 0; index < length; index += 1) {
    const aValue = Number(a[index]) || 0;
    const bValue = Number(b[index]) || 0;
    sum += aValue * bValue;
  }
  return sum;
};

const magnitude = (vector = []) => {
  if (!Array.isArray(vector) || vector.length === 0) return 0;
  let sumSquares = 0;
  for (let index = 0; index < vector.length; index += 1) {
    const value = Number(vector[index]) || 0;
    sumSquares += value * value;
  }
  return Math.sqrt(sumSquares);
};

const cosineSimilarity = (a = [], b = []) => {
  if (!Array.isArray(a) || !Array.isArray(b) || !a.length || !b.length) {
    return 0;
  }
  const magnitudeA = magnitude(a);
  const magnitudeB = magnitude(b);
  if (magnitudeA < EPSILON || magnitudeB < EPSILON) {
    return 0;
  }
  const similarity = dotProduct(a, b) / (magnitudeA * magnitudeB);
  if (!Number.isFinite(similarity)) {
    return 0;
  }
  return Math.max(-1, Math.min(1, similarity));
};

module.exports = {
  cosineSimilarity,
};
