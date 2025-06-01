use crate::net::Connection;
use crate::balatro::{
    Error,
    shop::Shop,
};

use super::blinds::Tag;

pub struct RoundOverview<'a> {
    connection: &'a mut Connection,
    info: protocol::RoundOverviewInfo,
}

impl<'a> RoundOverview<'a> {
    pub(crate) fn new(info: protocol::RoundOverviewInfo, connection: &'a mut Connection) -> Self {
        Self { info, connection }
    }

    pub fn earnings(&self) -> Vec<Earning> {
        self.info.earnings.iter().map(|e| {
            let kind = match e.kind.clone() {
                protocol::EarningKind::Joker(s) => EarningKind::Joker(s.clone()),
                protocol::EarningKind::Tag(t) => EarningKind::Tag(t.clone()),
                protocol::EarningKind::Blind(_) => EarningKind::Blind,
                protocol::EarningKind::Interest(_) => EarningKind::Interest,
                protocol::EarningKind::Hands(h) => EarningKind::Hands(h),
                protocol::EarningKind::Discards(d) => EarningKind::Discards(d),
            };
            Earning { kind, value: e.value }
        }).collect()
    }

    pub fn total_earned(&self) -> u64 {
        self.info.total_earned
    }

    pub async fn cash_out(self) -> Result<Shop<'a>, Error> {
        let info = self.connection.request(protocol::CashOut).await??;
        Ok(Shop::new(info, self.connection))
    }
}

#[derive(Clone, Debug)]
pub struct Earning {
    pub kind: EarningKind,
    pub value: u64,
}

#[derive(Clone, Debug)]
pub enum EarningKind {
    Joker(String),
    Tag(Tag),
    Blind,
    Interest,
    Hands(u64),
    Discards(u64),
}

pub struct GameOverview<'a> {
    connection: &'a mut Connection,
}

impl<'a> GameOverview<'a> {
    pub(crate) fn new(connection: &'a mut Connection) -> Self {
        Self { connection }
    }
}

pub(crate) mod protocol {
    use serde::{Deserialize, Serialize};
    use crate::{
        net::protocol::{Packet, Request, Response},
        balatro::{overview::Tag,shop::protocol::ShopInfo},
    };

    #[derive(Serialize, Deserialize, Clone)]
    pub struct RoundOverviewInfo {
        pub earnings: Vec<Earning>,
        pub total_earned: u64,
    }

    impl Response for RoundOverviewInfo {}

    impl Packet for RoundOverviewInfo {
        fn kind() -> String {
            "overview/round".to_string()
        }
    }

    #[derive(Serialize, Deserialize, Clone)]
    pub struct Earning {
        pub kind: EarningKind,
        pub value: u64,
    }

    #[derive(Serialize, Deserialize, Clone)]
    pub enum EarningKind {
        Joker(String),
        Tag(Tag),
        Blind(Vec<()>),
        Interest(Vec<()>),
        Hands(u64),
        Discards(u64),
    }

    #[derive(Serialize, Deserialize, Clone)]
    pub struct CashOut;

    impl Request for CashOut {
        type Expect = Result<ShopInfo, String>;
    }

    impl Packet for CashOut {
        fn kind() -> String {
            "overview/cash_out".to_string()
        }
    }
}
