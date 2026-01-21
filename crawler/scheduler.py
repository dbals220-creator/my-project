from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from crawler.main import TheqooCrawler


def crawl_job():
    """크롤링 작업 실행"""
    print(f"\n{'='*50}")
    print(f"스케줄 실행: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print('='*50)

    try:
        crawler = TheqooCrawler()
        crawler.run()
    except Exception as e:
        print(f"크롤링 오류 발생: {e}")


def main():
    # 스케줄러 설정
    scheduler = BlockingScheduler()

    # 1시간마다 실행
    scheduler.add_job(
        crawl_job,
        trigger=IntervalTrigger(hours=1),
        id='theqoo_crawler',
        name='더쿠 인기글 수집',
        replace_existing=True
    )

    print("더쿠 인기글 수집 스케줄러 시작")
    print("- 실행 주기: 1시간")
    print("- 종료: Ctrl+C")
    print()

    # 최초 1회 즉시 실행
    crawl_job()

    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        print("\n스케줄러 종료")


if __name__ == '__main__':
    main()
