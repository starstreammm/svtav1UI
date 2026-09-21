from datetime import datetime, timedelta, timezone


class Timer:
    def __init__(self):
        self.start_time = datetime.now(timezone.utc)
        self.suspend_timer = datetime.now(timezone.utc)
        self.suspend_total = timedelta(0)
        self.is_suspend = False

    def suspend(self):
        self.suspend_timer = datetime.now(timezone.utc)
        self.is_suspend = True

    def resume(self):
        self.is_suspend = False
        self.suspend_total += datetime.now(timezone.utc) - self.suspend_timer

    def total(self):
        if self.is_suspend:
            return self.suspend_timer - self.start_time - self.suspend_total
        else:
            return datetime.now(timezone.utc) - self.start_time - self.suspend_total
