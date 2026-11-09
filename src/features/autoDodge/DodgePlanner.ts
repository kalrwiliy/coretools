export function minClearance(
  relativeX: number,
  relativeY: number,
  velocityX: number,
  velocityY: number,
  duration: number,
  radius: number,
): number {
  let speedSquared: number,
    closestTime: number,
    clampedTime: number,
    closestX: number,
    closestY: number;
  if ((speedSquared = velocityX * velocityX + velocityY * velocityY) < 1e-10)
    return Math.sqrt(relativeX * relativeX + relativeY * relativeY) - radius;
  if ((closestTime = -(relativeX * velocityX + relativeY * velocityY) / speedSquared) < 0) {
    clampedTime = 0;
  } else if (closestTime > duration) {
    clampedTime = duration;
  } else {
    clampedTime = closestTime;
  }
  closestX = relativeX + velocityX * clampedTime;
  closestY = relativeY + velocityY * clampedTime;
  return Math.sqrt(closestX * closestX + closestY * closestY) - radius;
}
export function chooseEscapePoint(
  snapshots: any,
  x: any,
  y: any,
  radius: any,
  speed: any,
  directionSamples: number,
): any {
  let threats: any,
    index: any,
    snapshot: any,
    vx: any,
    vy: any,
    timeLeft: any,
    bestClearance: any,
    bestAngle: any;
  let direction: any,
    cs: any,
    sn: any,
    minimumClearance: any,
    threatIndex: any,
    threat: any,
    clearance: any;
  threats = [];
  for (index = 0; index < snapshots.length; index++) {
    snapshot = snapshots[index];
    vx = Math.cos(snapshot.heading) * snapshot.speed;
    vy = Math.sin(snapshot.heading) * snapshot.speed;
    if (snapshot.speed > 0) {
      timeLeft = Math.max(0, (snapshot.range - snapshot.travelled) / snapshot.speed);
    } else {
      timeLeft = 0;
    }
    threats.push({
      relX: x - snapshot.x,
      relY: y - snapshot.y,
      velX: vx,
      velY: vy,
      timeLeft: timeLeft,
      combinedRadius: snapshot.radius + radius,
    });
  }
  bestClearance = -Infinity;
  bestAngle = 0;
  for (direction = 0; direction < directionSamples; direction++) {
    cs = Math.cos((direction / directionSamples) * 2 * Math.PI);
    sn = Math.sin((direction / directionSamples) * 2 * Math.PI);
    minimumClearance = Infinity;
    for (threatIndex = 0; threatIndex < threats.length; threatIndex++) {
      threat = threats[threatIndex];
      if (
        (clearance = minClearance(
          threat.relX,
          threat.relY,
          cs * speed - threat.velX,
          sn * speed - threat.velY,
          threat.timeLeft,
          threat.combinedRadius,
        )) < minimumClearance
      ) {
        minimumClearance = clearance;
      }
    }
    if (minimumClearance > bestClearance) {
      bestClearance = minimumClearance;
      bestAngle = Math.atan2(sn, cs);
    }
  }
  return {
    x: x + Math.cos(bestAngle) * 450,
    y: y + Math.sin(bestAngle) * 450,
  };
}
